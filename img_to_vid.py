from rembg import remove
from PIL import Image
import cv2
import imageio
from pathlib import Path
import numpy as np

INPUT_VIDEO = "pig-gigging.mov"
OUTPUT_VIDEO = "pig-gigging-transparent.mp4"

print("▶ Processing video...")
cap = cv2.VideoCapture(INPUT_VIDEO)
fps = cap.get(cv2.CAP_PROP_FPS)

frames = []
frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Convert to PIL Image  
    img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    # Remove background
    result = remove(img)
    # Convert to numpy array
    frames.append(np.array(result))
    frame_count += 1
    
    print(f"  Frame {frame_count}...")

cap.release()

print("▶ Saving video...")
imageio.mimsave(OUTPUT_VIDEO, frames, fps=fps, format='MP4', codec='libx264')

print(f"✅ Done! {OUTPUT_VIDEO}")
