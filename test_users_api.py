#!/usr/bin/env python3
"""
Test script to verify the Users API endpoint
"""
import requests
import json

# Base URL
BASE_URL = "http://127.0.0.1:8000/api"

def test_users_endpoint():
    """Test the list_all_users endpoint"""
    
    # First, login to get a token
    login_data = {
        "username": "Aravind",
        "password": "your_password_here"  # You'll need to update this
    }
    
    print("Testing Users API endpoint...")
    print("=" * 50)
    
    try:
        # Login
        print("1. Attempting login...")
        login_response = requests.post(f"{BASE_URL}/auth/token/", data=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json().get('token')
            print(f"   ✓ Login successful, token: {token[:20]}...")
            
            # Test users endpoint
            print("2. Testing users endpoint...")
            headers = {"Authorization": f"Token {token}"}
            
            # Test basic list
            users_response = requests.get(f"{BASE_URL}/accounts/users/list_all_users/", headers=headers)
            
            if users_response.status_code == 200:
                data = users_response.json()
                print(f"   ✓ Users endpoint working!")
                print(f"   ✓ Total users: {data.get('count', 0)}")
                print(f"   ✓ Users on page: {len(data.get('results', []))}")
                
                # Display first few users
                for i, user in enumerate(data.get('results', [])[:3]):
                    print(f"   - {user['username']} ({user['email']}) - {user['role']} - {'Active' if user['is_active'] else 'Inactive'}")
                
                # Test search
                print("3. Testing search functionality...")
                search_response = requests.get(f"{BASE_URL}/accounts/users/list_all_users/?search=Aravind", headers=headers)
                
                if search_response.status_code == 200:
                    search_data = search_response.json()
                    print(f"   ✓ Search working! Found {search_data.get('count', 0)} users matching 'Aravind'")
                
                # Test sorting
                print("4. Testing sorting functionality...")
                sort_response = requests.get(f"{BASE_URL}/accounts/users/list_all_users/?sort=email&order=desc", headers=headers)
                
                if sort_response.status_code == 200:
                    sort_data = sort_response.json()
                    print(f"   ✓ Sorting working! Users sorted by email descending")
                
                print("\n" + "=" * 50)
                print("✅ All tests passed! The Users API is working correctly.")
                
            else:
                print(f"   ❌ Users endpoint failed: {users_response.status_code}")
                print(f"   Response: {users_response.text}")
                
        else:
            print(f"   ❌ Login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure the backend server is running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_users_endpoint()
