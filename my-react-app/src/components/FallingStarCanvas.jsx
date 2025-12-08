import { useEffect, useRef } from "react";
import React from "react";

export default function FallingStarCanvas() {
  const canvasRef = useRef(null);
  const stars = [];
  const STAR_COUNT = 200;

  function createStar(width, height) {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 1 + 0.5, 
      opacity: Math.random() * 0.8 + 0.2,
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Fullscreen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Tạo danh sách sao ban đầu
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar(canvas.width, canvas.height));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let s of stars) {
        ctx.globalAlpha = s.opacity;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        // Update vị trí rơi
        s.y += s.speed;

        if (s.y > canvas.height) {
          s.x = Math.random() * canvas.width;
          s.y = -10;
        }
      }

      requestAnimationFrame(draw);
    }

    draw();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
