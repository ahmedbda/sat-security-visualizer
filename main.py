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

# loading html site (frontend)
@app.get("/", response_class=HTMLResponse)
def main_site():
    return FileResponse("static/index.html")

@app.get("/asteroids")
def get_asteroids_data():
    # timestamps calculation
    today = datetime.now().strftime("%Y-%m-%d")
    
    # request url (separated for readability) 
    url = f"https://api.nasa.gov/neo/rest/v1/feed?start_date={today}&end_date={today}&api_key={api_key}"


    # api request for today and extracting the json from it in data
    data = requests.get(url).json()

    # removing api key from top level links for security purposes
    if "links" in data:
        del data["links"]

    # removing api key from full json file
    near_earth_objects = data.get("near_earth_objects", {})    
    for date in near_earth_objects:
        for asteroid in near_earth_objects[date]:
            if "links" in asteroid:
                del asteroid["links"]

    # checking response json file
    return data

# serving the static app
app.mount("/static", StaticFiles(directory="static"), name="static")