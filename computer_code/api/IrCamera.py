import cv2
import numpy as np

class IrCamera:
    def __init__(self, port, resolution=None, fps=None, gain=None, exposure=None):
        self.port = port
        self.resolution = resolution
        self.fps = fps
        self.gain = gain
        self.exposure = exposure

        self.camera = cv2.VideoCapture(self.port)
        
        if not self.camera.isOpened():
            raise ValueError("Unable to connect to camera at port ", self.port)
        
        # Set pixel format to MJPG
        self.camera.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))

        # Check if resolution matches predefined formats
        resolutions = [(320, 240), (640, 480), (800, 600), (1024, 768), (1280, 720), (1280, 1024), (1920, 1080)]
        if self.resolution not in resolutions:
            raise ValueError("Invalid resolution. Please choose from ", resolutions)
        
        if self.resolution is not None:
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
        
        if self.fps is not None:
            self.camera.set(cv2.CAP_PROP_FPS, self.fps)
        
        if self.gain is not None:
            self.camera.set(cv2.CAP_PROP_GAIN, self.gain)
        
        if self.exposure is not None:
            self.camera.set(cv2.CAP_PROP_EXPOSURE, self.exposure)

    def start_capture(self):
        # TODO: Implement the logic to start capturing infrared images
        pass

    def stop_capture(self):
        # TODO: Implement the logic to stop capturing infrared images
        pass

    def process_frame(self, frame):
        # TODO: Implement the logic to process each captured frame
        pass

    def save_frame(self, frame, filename):
        # TODO: Implement the logic to save a frame to a file
        pass