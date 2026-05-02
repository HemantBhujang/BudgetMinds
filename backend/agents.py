from typing import Dict, TypedDict, List, Annotated
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import os
from dotenv import load_dotenv
import json
# import requests # Removed as firebase_admin is used

import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

# FIREBASE_API_KEY is no longer needed with firebase_admin SDK
FIREBASE_PROJECT_ID = "budgetminds-7cbbc"

def fetch_firestore_history():
    try:
        db = firestore.client()
        docs = db.collection('historical_events').limit(10).stream()
        history_str = "Company Firebase History (INR):\n"
        has_data = False
        for d in docs:
            has_data = True
            fields = d.to_dict()
            name = fields.get("eventName", "")
            cost = fields.get("totalBudgetINR", 0)
            outcome = fields.get("businessOutcome", "")
            history_str += f"- Event: {name}, Actual Cost: ₹{cost}, Outcome: {outcome}\n"
        
        if not has_data:
            return "No historical data available."
        return history_str
    except Exception as e:
        print(f"Error fetching Firebase History: {e}")
        return "No historical data available."

# Initialize Gemini model
# Note: Ensure GOOGLE_API_KEY is set in environment variables
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)

# Define State
class GraphState(TypedDict):
    event_context: str
    budget_items: List[Dict[str, any]]
    historical_context: str
    market_research: str
    audit_results: List[Dict[str, any]]
    final_report: str
    total_requested: float
    total_suggested: float

# 1. Historical Data Agent
def historical_data_agent(state: GraphState) -> Dict:
    raw_history = fetch_firestore_history()
    event_context = state.get("event_context", "")
    
    if raw_history == "No historical data available.":
        return {"historical_context": "This event is new to the organisation."}
        
    prompt = PromptTemplate.from_template(
        "You are an AI data compiler. The user is planning a new event: '{event_context}'.\n"
        "Here is the database of past events:\n{raw_history}\n\n"
        "Analyze if ANY past event shares similarities, matching themes, or intent with the new event (e.g. Qawwali matches a Cultural/Music Night, or Retreat matches Offsite).\n"
        "Be extremely forgiving. If there is ANY thematic overlap, consider it a match.\n"
        "If there IS a semantic match, reply with its details and explicitly state: 'A similar past event was found. The proposed budget should closely match this event's cost.'\n"
        "If and only if there are NO thematic overlaps whatsoever, reply EXACTLY with: 'This event is new to the organisation.'"
    )
    try:
        chain = prompt | llm
        filtered_history = chain.invoke({
            "event_context": event_context,
            "raw_history": raw_history
        }).content
    except Exception:
        filtered_history = "This event is new to the organisation."
        
    return {"historical_context": filtered_history}

# 2. Market Price Research Agent
def market_research_agent(state: GraphState) -> Dict:
    items_str = ", ".join([item["item_name"] for item in state["budget_items"]])
    prompt = PromptTemplate.from_template(
        "You are an Indian Market Research Expert. Estimate current fair market prices for these event items in India (INR / ₹): {items_str}. "
        "Search popular Indian vendor pricing and provide a brutally short, single paragraph summary (max 3 sentences) of current market rates in INR."
    )
    try:
        chain = prompt | llm
        market_research = chain.invoke({"items_str": items_str}).content
    except Exception:
        market_research = "Market research failed. Assume standard Indian pricing."
    return {"market_research": market_research}

# 3. Budget Analyzer Agent
def budget_analyzer_agent(state: GraphState) -> Dict:
    items = state["budget_items"]
    historical = state.get("historical_context", "")
    market = state.get("market_research", "")
    
    prompt = PromptTemplate.from_template(
        "You are an expert AI Budget Auditor in India. Review the requested budget items.\n"
        "Historical Context from Firebase: {historical}\n"
        "Indian Market Research: {market}\n\n"
        "Items to Review (Each has a 'quantity' and a 'requested_amount' representing TOTAL cost):\n{items_json}\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. Take the quantity into account. Your suggested_amount must be the TOTAL cost for the specified quantity (i.e. unit price * quantity).\n"
        "2. If Historical Context says 'This event is new to the organisation.', base your total suggested amount strictly on the Indian Market Research.\n"
        "3. If Historical Context provides a similar past event, YOUR FINAL SUGGESTED BUDGET MUST BE NEARLY THE EXACT AMOUNT OF THE PAST EVENT, adjusting only slightly for inflation or quantity proportion. Do not override historic costs with market research.\n\n"
        "Return the result ONLY as a valid JSON array of objects with keys: 'id' (integer), 'item_name' (string), 'suggested_amount' (float), and 'reasoning' (string). "
        "Do not include any other text or markdown formatting."
    )
    
    chain = prompt | llm
    response = chain.invoke({
        "historical": historical,
        "market": market,
        "items_json": json.dumps(items)
    }).content
    
    # Try to parse the JSON response
    try:
        # Strip markdown code blocks if present
        clean_response = response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:-3].strip()
        elif clean_response.startswith("```"):
            clean_response = clean_response[3:-3].strip()
            
        audit_results = json.loads(clean_response)
        
        total_req = sum(item["requested_amount"] for item in items)
        total_sug = sum(item["suggested_amount"] for item in audit_results)
        
        return {
            "audit_results": audit_results,
            "total_requested": total_req,
            "total_suggested": total_sug
        }
    except Exception as e:
        print(f"Error parsing JSON from LLM: {e}")
        # Fallback if JSON parsing fails
        fallback_results = []
        for item in items:
            fallback_results.append({
                "id": item["id"],
                "item_name": item["item_name"],
                "suggested_amount": item["requested_amount"],
                "reasoning": "AI Audit failed to parse, accepting requested amount."
            })
        return {
            "audit_results": fallback_results,
            "total_requested": sum(item["requested_amount"] for item in items),
            "total_suggested": sum(item["requested_amount"] for item in items)
        }

# 4. Final Decision Agent (Compiles Report)
def compilation_agent(state: GraphState) -> Dict:
    audit_summary = "\n".join([f"- {i['item_name']}: Sug ₹{i['suggested_amount']} (Reason: {i['reasoning']})" for i in state.get('audit_results', [])])
    
    prompt = PromptTemplate.from_template(
        "Generate a highly readable, professional, and EXTREMELY SHORT markdown executive summary for the Principal (max 3 short paragraphs).\n"
        "Explain exactly how the budget was estimated by comparing the historical data and real-time Indian market prices. Use Indian formatting (₹).\n\n"
        "Total Requested: ₹{total_req}\n"
        "Total Suggested: ₹{total_sug}\n"
        "Historical Context: {historical}\n"
        "Market Rates: {market}\n"
        "Item Breakdown: {audit_summary}\n\n"
        "Output ONLY the markdown report. Make sure it is highly readable and clearly formatted."
    )
    
    try:
        chain = prompt | llm
        report = chain.invoke({
            "total_req": state.get("total_requested", 0),
            "total_sug": state.get("total_suggested", 0),
            "historical": state.get("historical_context", ""),
            "market": state.get("market_research", ""),
            "audit_summary": audit_summary
        }).content
    except Exception:
        report = "Failed to compile final markdown report."
    
    return {"final_report": report}

# Build Graph
builder = StateGraph(GraphState)

builder.add_node("historical_data", historical_data_agent)
builder.add_node("market_research_node", market_research_agent)
builder.add_node("budget_analyzer", budget_analyzer_agent)
builder.add_node("compilation", compilation_agent)

builder.set_entry_point("historical_data")
builder.add_edge("historical_data", "market_research_node")
builder.add_edge("market_research_node", "budget_analyzer")
builder.add_edge("budget_analyzer", "compilation")
builder.add_edge("compilation", END)

# Compile the graph
audit_app = builder.compile()

# Helper function to run the audit
def run_budget_audit(event_description: str, items: List[Dict]):
    initial_state = {
        "event_context": event_description,
        "budget_items": items,
        "historical_context": "",
        "market_research": "",
        "audit_results": [],
        "final_report": "",
        "total_requested": 0.0,
        "total_suggested": 0.0
    }
    
    # Run the graph
    result = audit_app.invoke(initial_state)
    return result
