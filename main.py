# fastapi for the frontend
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import HTMLResponse
from fastapi.responses import FileResponse

# .env loading and api requests for backend
import requests
import os
from dotenv import load_dotenv
from datetime import datetime

app = FastAPI()

load_dotenv() # loads .env (api key) needed since this project will be open source on github
api_key = os.getenv("nasa_api_key")

# timestamps calculation
today = datetime.now().strftime("%Y-%m-%d")

# api request for today
request = requests.get(f"https://api.nasa.gov/neo/rest/v1/feed?start_date={today}&end_date={today}&api_key={api_key}")

#test
print(request)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
def main_site():
    return FileResponse("static/index.html")