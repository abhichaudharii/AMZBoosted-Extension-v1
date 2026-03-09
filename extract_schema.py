import psycopg2
import sys
import logging

# Set up logging for better visibility
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Basic connection info
HOST = "aws-0-us-west-1.pooler.supabase.com"
PASSWORD = "1HEdrTt4S7v4cDPZ"
DBNAME = "postgres"
PROJECT_ID = "ricpwvbbhwkurnracbpe"

def get_schema_advanced(conn_params, table_name):
    try:
        conn = psycopg2.connect(**conn_params, sslmode='require', connect_timeout=10)
        cur = conn.cursor()
        
        sql_output = []
        
        # 1. Get Table Structure
        cur.execute("""
            SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position;
        """, (table_name,))
        
        columns = cur.fetchall()
        if not columns:
            return None

        sql_output.append(f"CREATE TABLE IF NOT EXISTS {table_name} (")
        col_defs = []
        for col in columns:
            name, dtype, length, nullable, default = col
            if dtype == 'character varying' and length:
                dtype = f"varchar({length})"
            
            line = f"    {name} {dtype}"
            if nullable == 'NO':
                line += " NOT NULL"
            if default:
                line += f" DEFAULT {default}"
            col_defs.append(line)
        
        sql_output.append(",\n".join(col_defs))
        sql_output.append(");")
        sql_output.append("")

        # 2. Get Constraints
        cur.execute("""
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            WHERE conrelid = %s::regclass;
        """, (table_name,))
        
        constraints = cur.fetchall()
        for con in constraints:
            sql_output.append(f"ALTER TABLE {table_name} ADD CONSTRAINT {con[0]} {con[1]};")
        
        if constraints:
            sql_output.append("")

        # 3. Get Indexes
        cur.execute("""
            SELECT indexdef FROM pg_indexes WHERE tablename = %s;
        """, (table_name,))
        
        indexes = cur.fetchall()
        for idx in indexes:
            sql_output.append(f"{idx[0]};")
            
        cur.close()
        conn.close()
        return "\n".join(sql_output)
    except Exception as e:
        logger.error(f"Error in extraction: {e}")
        return None

def test_config(params):
    try:
        conn = psycopg2.connect(**params, sslmode='require', connect_timeout=10)
        conn.close()
        return True
    except Exception as e:
        logger.warning(f"Connection failed: {e}")
        with open("error_log.txt", "a") as f:
            f.write(f"Config failed: {params} | Error: {e}\n")
        return False

if __name__ == "__main__":
    configs = [
        # Pattern 1: Simple postgres (Supabase often handles the tenant via host/port)
        {
            "host": HOST,
            "port": 6543,
            "user": "postgres",
            "password": PASSWORD,
            "dbname": DBNAME
        },
        # Pattern 2: DSN format
        {
            "dsn": f"postgresql://postgres:{PASSWORD}@{HOST}:6543/{DBNAME}"
        }
    ]
    
    active_config = None
    for i, config in enumerate(configs, 1):
        logger.info(f"Testing config {i}...")
        if test_config(config):
            logger.info(f"Config {i} SUCCEEDED!")
            active_config = config
            break
            
    if not active_config:
        logger.error("All connection configurations failed.")
        sys.exit(1)

    try:
        conn = psycopg2.connect(**active_config, sslmode='require')
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()
        
        logger.info(f"Available tables: {', '.join(tables)}")
        
        target_table = 'chumesa'
        match = next((t for t in tables if t.lower() == target_table.lower()), None)
        
        if match:
            logger.info(f"Found table: {match}")
            schema = get_schema_advanced(active_config, match)
            if schema:
                with open("schema.sql", "w") as f:
                    f.write(schema)
                logger.info("Successfully generated schema.sql")
            else:
                logger.error("Failed to generate schema.")
        else:
            logger.error(f"Table '{target_table}' not found in public schema.")
    except Exception as e:
        logger.error(f"Fatal error in main: {e}")
