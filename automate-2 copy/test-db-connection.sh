#!/bin/bash

echo "Testing MySQL database connection..."
echo "=================================="

# Test basic connectivity to MySQL server
echo -e "\n1. Testing MySQL port connectivity:"
nc -zv 10.1.45.1 3306 2>&1 || echo "Connection failed"

# Test with MySQL client if available
echo -e "\n2. Testing MySQL client connection:"
if command -v mysql &> /dev/null; then
    mysql -h 10.1.45.1 -u dev -p'dev@123' -e "SELECT 1;" 2>&1 || echo "MySQL client connection failed"
else
    echo "MySQL client not installed"
fi

echo -e "\n3. Testing Java connection to MySQL:"
cat > TestDbConnection.java << 'EOF'
import java.sql.*;

public class TestDbConnection {
    public static void main(String[] args) {
        String url = "jdbc:mysql://10.1.45.1:3306/sd_apps_db?useSSL=false";
        String username = "dev";
        String password = "dev@123";
        
        try {
            Connection conn = DriverManager.getConnection(url, username, password);
            System.out.println("Database connection successful!");
            conn.close();
        } catch (SQLException e) {
            System.out.println("Database connection failed: " + e.getMessage());
        }
    }
}
EOF

# Compile and run if javac available
if command -v javac &> /dev/null; then
    javac TestDbConnection.java 2>/dev/null && java TestDbConnection 2>&1
    rm -f TestDbConnection.java TestDbConnection.class
else
    echo "Java compiler not available"
fi

echo -e "\n=================================="
echo "Database connection test completed."
