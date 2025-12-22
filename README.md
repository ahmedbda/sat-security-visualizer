# NASA asteroid constellation visualizer

A Python Web visualization project using FastAPI to show NEOs with the NASA NeoWs API

## Demonstration
You can find the website [here](ast-visualizer.vercel.app)

<p align="center">
<img src="assets/showcase.gif">
</p>

## Project goal
This project connects to the NASA NeoWs (Near Earth Object Web Service) API to retrieve real time data about asteroids passing close to Earth  

The goal is to render these objects in a 3D browser environment to visually assess their potential danger for educational purposes

## Visual scaling 
The distances between Earth and these asteroids are massive (millions of km) while the objects themselves are relatively small (meters or km)  

To make the visualization renderable in a web browser, I implemented a scaling logic

### Distance scaling
The 3D scene cannot handle raw values in the millions so I applied down-scaling by dividing the real distance by 100000   

This transforms the astronomical distance to a smaller manageable one in the 3D scene, making all the objects visible

### Object scaling
An asteroid of 1 kilo-meter diameter at a distance of 1 million kilo-meters would be invisible (smaller than a pixel) so I normalized the sizes and divided them by a factor of 50  

To prevent small rocks from disappearing, if the radius is normalized if it is smaller than 0.5 radius units (with 10 being the Earth's radius)

This ensures the asteroids appear as visible objects rather than invisible dots allowing the user to click on them while preserving the relative size difference between a small and a big asteroid

## Interactive Features
The interface consists of 3 sidebars

### Controls
A first sidebar for the controls, showing
* How to rotate
* How to move
* How to zoom
* The data source
* The number of asteroids detected
* A link to the documentation

### Date picker
By default the website shows data for the current day but the second sidebar is a date picker allowing users to chose a certain day, refreshing the data (new API request) and updating the 3D render

### Data
Clicking on any asteroid in the 3D view updates a sidebar displaying precise API data that cannot be conveyed by position alone, such as  
* The type of the object (planet or asteroid)
* The name of the object
* The distance from Earth (for asteroids)
* The diameter of the object
* The danger of the object (given by the NASA API or the object type)
