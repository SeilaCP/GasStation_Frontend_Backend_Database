import psycopg2
import random
from faker import Faker

# Initialize Faker
fake = Faker()

# PostgreSQL connection parameters
DB_NAME = "traffic"
DB_USER = "postgres"
DB_PASSWORD = "Alg0r1thm@c#"
DB_HOST = "localhost"
DB_PORT = "5432"

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT
)
cursor = conn.cursor()

# Vehicle types for random choice
vehicle_types = [
    "Sedan", "Pickup Truck", "Motorcycle 50cc", "Motorcycle 110cc",
    "Motorcycle 150cc", "Motorcycle 250cc", "Light Truck", "SUV"
]

cursor.execute("SELECT COALESCE(MAX(customerid), 0) FROM gasstation.Customer;")
max_id = cursor.fetchone()[0]

# Function to generate a single customer
def generate_customer(customerid):
    customername = "customer_" + str(customerid)
    address = f"{fake.street_name()}, City"
    phonenumber = fake.unique.msisdn()[:10]
    email = fake.unique.email()
    notes = "Regular customer"
    vehicletypename = random.choice(vehicle_types)
    licenseplate = fake.bothify(text='???-####').upper()
    return (customerid, customername, address, phonenumber, email, notes, vehicletypename, licenseplate)

# Insert multiple fake customers
def insert_customers(n):
    global max_id
    for _ in range(n):
        max_id += 1
        customer = generate_customer(max_id)
        try:
            cursor.execute('''
                INSERT INTO gasstation.Customer(
                    customerid, customername, address, phonenumber, email,
                    notes, vehicletypename, licenseplate
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''', customer)
        except psycopg2.errors.UniqueViolation:
            print("Duplicate entry, skipping...")
            conn.rollback()
        else:
            conn.commit()
    print(f"{n} customer(s) added to the database.")

# Example usage
print(max_id)
insert_customers(1)

# Fetch and display all customers
cursor.execute("SELECT * FROM gasstation.Customer;")
for row in cursor.fetchall():
        print(row)

# Close connection
cursor.close()
conn.close()
