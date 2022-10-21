import React from 'react'
import { useEffect, useRef, useState } from "react";

export default function canvas () {

    const canvas = useRef();

    const [isCollapse, setIsCollapse] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [end, setEnd] = useState({ x: 0, y: 0 });
    const [isStart, setIsStart] = useState(true);
    const [Lines, setLines] = useState([]);

    useEffect(() => {
        if (!canvas.current) return;
        canvas.current.addEventListener("contextmenu", e => { // when pressed right button
            e.preventDefault();
            setIsDrawing(false);
            setIsStart(true);
        }); 
        let ctx = canvas.current.getContext("2d");
        ctx.fillStyle = 'red'; // for filling circles
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height); // clear canvas
        if (isDrawing) drawLine(ctx); // draw line to mouse
        linesDraw(ctx); // draw all previous lines and their collisions
    }, [isDrawing, start, end]);

    function mouseDown(e) {
        if (isCollapse) return;
        console.log("MousePress =", e.button == 0 ? "Left" : e.button == 2 ? "Right" : ""); 
        if (e.button == 0) { // if pressed left button
            if (isStart) { // if the previous line was finished, start a new one
                setStart({
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY
                })
                setEnd({
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY,
                });
            }
            else { // if finished drawing the current line
                setLines(lines => [...lines, { // add it to array
                    startPosition: start,
                    endPosition: end,
                    midPoint: {
                        x: (start.x + end.x) / 2,
                        y: (start.y + end.y) / 2
                    }
                }]);
            }
            setIsDrawing(!isDrawing); // and set the necessary parameters
            setIsStart(!isStart);
        }
    }

    function mouseMove(e) { // change the end point of the line that is drawn to the mouse
        if (isDrawing) {
            setEnd({
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY
            });
        }
    }

    function drawLine(ctx) { // draw a line that goes to the mouse
        if (!isCollapse) {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }

    function linesDraw(canvas) { // function for drawing all lines and their collisions
        Lines.map(({ startPosition, endPosition}) => { // drawing each line with collision to the line that is drawn to the mouse
            canvas.beginPath();
            canvas.moveTo(startPosition.x, startPosition.y);
            canvas.lineTo(endPosition.x, endPosition.y);
            canvas.stroke();
            if (isDrawing) collisionDetection(canvas, startPosition.x, startPosition.y, endPosition.x, endPosition.y, start.x, start.y, end.x, end.y);
        });
        for (let i = 0; i < Lines.length; i++) { // drawing collisions between lines
            for (let j = i+1; j < Lines.length; j++) {
                collisionDetection(canvas, Lines[i].startPosition.x, Lines[i].startPosition.y, Lines[i].endPosition.x, Lines[i].endPosition.y, Lines[j].startPosition.x, Lines[j].startPosition.y, Lines[j].endPosition.x, Lines[j].endPosition.y)
        }}
    }

    function collisionDetection(canvas, x1, y1, x2, y2, x3, y3, x4, y4) { // function to search and draw collisions
        let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
        let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)); 
        let radius = 5;

        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) { // If a collision is detected, draw a circle on the calculated coordinates
            let intersectionX = x1 + (uA * (x2-x1));
            let intersectionY = y1 + (uA * (y2-y1));
            canvas.beginPath();
            canvas.moveTo(intersectionX+radius, intersectionY);
            canvas.arc(intersectionX, intersectionY, radius, 0, 2 * Math.PI);
            canvas.fill();
            canvas.stroke();
        }
    }

    async function linesCollapse(e) { // function to erase lines
        if (Lines.length == 0 | !canvas.current | isCollapse) return;
        setIsCollapse(true);
        let ctx = canvas.current.getContext("2d");
        let speedOfReduction = 15; // line reduction multiplier
        for (let i = 0; i < 100; i++) { // line reduction cycle with a duration of 3 seconds
            ctx.beginPath();
            ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
            Lines.map(({startPosition, endPosition, midPoint}) => {
                startPosition.x = startPosition.x + ((midPoint.x-startPosition.x) / speedOfReduction);
                startPosition.y = startPosition.y + ((midPoint.y-startPosition.y) / speedOfReduction);
                endPosition.x = endPosition.x - ((endPosition.x-midPoint.x) / speedOfReduction);
                endPosition.y = endPosition.y - ((endPosition.y-midPoint.y) / speedOfReduction);
            })
            linesDraw(ctx);
            await delay(30);
        }
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height); // screen cleaning
        Lines.length = 0; // removing lines from an array
        setIsCollapse(false);
    }

    const delay = ms => new Promise( // delay function
        resolve => setTimeout(resolve, ms)
    );

  return (
    <>
    <canvas
        ref={canvas}
        onMouseDown={mouseDown}
        onMouseMove={mouseMove}
        height="800"
        width="1200"
        id="canvas"
      ></canvas>
      <button id="collapse" onClick={linesCollapse}>Collapse lines</button>
    </>  
  )
}