from flask import Flask, render_template, request, redirect
import mysql.connector
from datetime import datetime
import config

app= Flask(__name__)

# --------------------------------
# MYSQL CONNECTION
# --------------------------------

def get_db():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="",
        database="orderna"
    )

# ---------------- HOME ----------------
@app.route("/")
def index():
    return render_template("index.html")

# ---------------- MENU ----------------
@app.route("/menu")
def menu():
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT menu.*, categories.name AS category
        FROM menu
        LEFT JOIN categories ON menu.category_id = categories.id
    """)
    items = cur.fetchall()

    conn.close()
    return render_template("menu.html", items=items)

# ---------------- SUBMIT ORDER ----------------
@app.route("/submit", methods=["POST"])
def submit():
    items = request.form.getlist("item")
    qtys = request.form.getlist("qty")
    details_list = request.form.getlist("details") # Get the new details from JS!

    conn = get_db()
    cur = conn.cursor()

    cur.execute("INSERT INTO orders (status, time) VALUES (%s, %s)",
                ("Pending", datetime.now()))
    order_id = cur.lastrowid

    # Zip now includes the details_list
    for item_id, qty, details in zip(items, qtys, details_list):
        if int(qty) > 0:
            cur.execute("""
                INSERT INTO order_items (order_id, menu_id, quantity, details)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item_id, qty, details))

    conn.commit()
    conn.close()

    return render_template("order_success.html", order_id=order_id)

# ---------------- TRACK ----------------
@app.route("/track", methods=["GET", "POST"])
def track():
    order = None
    items = []

    if request.method == "POST":
        order_id = request.form["order_id"]

        conn = get_db()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT * FROM orders WHERE id=%s", (order_id,))
        order = cur.fetchone()

        # Added order_items.details to the SELECT query
        cur.execute("""
            SELECT menu.name, order_items.quantity, order_items.details
            FROM order_items
            JOIN menu ON order_items.menu_id = menu.id
            WHERE order_items.order_id=%s
        """, (order_id,))
        items = cur.fetchall()

        conn.close()

    return render_template("track.html", order=order, items=items)

# ---------------- KITCHEN ----------------
@app.route("/kitchen")
def kitchen():
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # We updated the WHERE clause to hide both 'Ready' and 'Completed' orders
    cur.execute("""
        SELECT o.id, o.status, o.time, 
               GROUP_CONCAT(
                   CONCAT('<b>', oi.quantity, 'x ', m.name, '</b><br><span style="font-size:12px;color:#666;">', IFNULL(oi.details, ''), '</span>') 
                   SEPARATOR '<br><br>'
               ) as items_summary
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN menu m ON oi.menu_id = m.id
        WHERE o.status NOT IN ('Ready', 'Completed')
        GROUP BY o.id
        ORDER BY o.time ASC
    """)
    orders = cur.fetchall()
    conn.close()
    
    return render_template("kitchen.html", orders=orders)

# ---------------- UPDATE STATUS ----------------
@app.route("/update/<int:id>/<status>")
def update(id, status):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("UPDATE orders SET status=%s WHERE id=%s", (status, id))

    conn.commit()
    conn.close()

    return redirect("/kitchen")

# ---------------- ADMIN ----------------
@app.route("/admin/menu", methods=["GET", "POST"])
def admin_menu():
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    if request.method == "POST":
        name = request.form["name"]
        price = request.form["price"]
        category_id = request.form["category"]

        cur.execute("""
            INSERT INTO menu (name, price, category_id)
            VALUES (%s,%s,%s)
        """, (name, price, category_id))
        conn.commit()

    # 🟢 UPDATED: Joined categories so the name shows up in the admin table
    cur.execute("""
        SELECT menu.*, categories.name AS category_name 
        FROM menu 
        LEFT JOIN categories ON menu.category_id = categories.id
    """)
    items = cur.fetchall()

    cur.execute("SELECT * FROM categories")
    categories = cur.fetchall()

    conn.close()

    return render_template("admin_menu.html", items=items, categories=categories)

@app.route("/admin/logs")
def admin_logs():
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    
    # Simple analytics: Total orders and recent history
    cur.execute("SELECT * FROM orders ORDER BY time DESC LIMIT 50")
    logs = cur.fetchall()
    conn.close()
    return render_template("admin_logs.html", logs=logs)
# ---------------- DELETE ----------------
@app.route("/delete/<int:id>")
def delete(id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("DELETE FROM menu WHERE id=%s", (id,))
    conn.commit()
    conn.close()

    return redirect("/admin/menu")

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)