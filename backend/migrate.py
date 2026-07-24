import sqlite3
import traceback

def migrate():
    try:
        conn = sqlite3.connect('budgetminds.db')
        print("Connected to DB")
        try:
            conn.execute('ALTER TABLE events ADD COLUMN attachment_url TEXT;')
            print("Added attachment_url to events")
        except sqlite3.OperationalError as e:
            print(f"events table alter error (might exist already): {e}")
            
        try:
            conn.execute('ALTER TABLE budget_items ADD COLUMN quantity INTEGER DEFAULT 1;')
            print("Added quantity to budget_items")
        except sqlite3.OperationalError as e:
            print(f"budget_items table alter error (might exist already): {e}")
            
        conn.commit()
        conn.close()
        print("Migration complete")
    except Exception as e:
        traceback.print_exc()

if __name__ == '__main__':
    migrate()
