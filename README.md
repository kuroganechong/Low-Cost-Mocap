# Low Cost Mocap (for drones)

#### _BingSheng Changes_

### Overview
The camera driver has been modified to use USB cameras instead of the PSPeye. This change utilizes **OpenCV** with **Video4Linux2** as the backend to communicate with the cameras. To check the camera status, you may optionally install the required package with the following command:

```bash
sudo apt install v4l-utils
```

The modifications are organized into two main sections:
1. **Camera Calibration** (in `_Camera Params`) – Handles intrinsic parameters for the new cameras.
2. **Mocap Backend** (in `computer_code/api`) – Implements the motion capture system backend.
   
Additionally, some visual modifications have been made in `computer_code/src` to enhance the user interface for a more intuitive appearance.

---

### 1. Camera Calibration

To calibrate the camera, follow these steps:

- First, review the following **introductory files** for a better understanding of the calibration process:
    - `_How to Setup OpenCV`
    - `_How to get world coordinates`
    - `_Getting Camera Params`
  
- Use the **calibration scripts** to generate the optimal intrinsic properties for the camera. This is typically necessary when switching to new cameras or after any changes to existing cameras.

---

### 2. Mocap Backend

The mocap backend has been updated as follows:

- **Modified Files:**
    - `index.py` – Main file for the mocap backend.
    - `IrCamera.py` – Camera driver code.
    - `helpers.py` – Data processing for the motion capture system.

- **Calibration Process:**
    - To calibrate the system for a new camera layout, follow the GUI instructions. 
    - Use a **single LED marker** for initial calibration, followed by **two LED markers** with a fixed spacing (e.g., 15cm or another spacing specified in the code).
    - Once calibration is complete, you can track objects using a **three-marker setup**.

Read through the code to understand how the system works and how it integrates with the calibration and mocap tracking processes.

### Future work
1. Buy Network Video Recorder and IP cameras to make the system portable. Cameras should work at 850nm or 940nm infrared.
2. Modify the camera driver to work with new cameras, along with all the calibrations.
3. Simplify the setup using VICON wand (it has fixed distances for scale calibration)
4. Test cameras outdoors, possibly need some thresholding as outdoor environment is bright in IR range.

---

#### _Below is the original forked README._

### A general purpose motion capture system built from the ground up, used to autonomously fly multiple drones indoors

## YouTube Video
Watch this for information about the project & a demo!
[https://youtu.be/0ql20JKrscQ?si=jkxyOe-iCG7fa5th](https://youtu.be/0ql20JKrscQ?si=jkxyOe-iCG7fa5th)

[<img src="https://github.com/jyjblrd/Mocap-Drones/blob/main/images/thumbnail.png">](https://youtu.be/0ql20JKrscQ?si=jkxyOe-iCG7fa5th)

## Architectural Diagram
![](https://github.com/jyjblrd/Mocap-Drones/blob/main/images/architecture.png?raw=true)

## Dependencies
Install the pseyepy python library: [https://github.com/bensondaled/pseyepy](https://github.com/bensondaled/pseyepy)

This project requires the sfm (structure from motion) OpenCV module, which requires you to compile OpenCV from source[^1]. This is a bit of a pain, but these links should help you get started: [SFM dependencies](https://docs.opencv.org/4.x/db/db8/tutorial_sfm_installation.html) [OpenCV module installation guide](https://github.com/opencv/opencv_contrib/blob/master/README.md)

[^1]: ⚠️ The experimental [`no-cv-sfm`](https://github.com/jyjblrd/Low-Cost-Mocap/tree/no-cv-sfm) branch removes this OpenCV-SFM dependency, however it is *completely* untested. It is recommended to first try use the `main` branch which is tested, however feedback and bug reports on the `no-cv-sfm` branch are greatly appreciated. 

install npm and yarn

## Runing the code

From the computer_code directory Run `yarn install` to install node dependencies 

Then run `yarn run dev` to start the webserver. You will be given a url view the frontend interface.

In another terminal window, run `python3 api/index.py` to start the backend server. This is what receives the camera streams and does motion capture computations.

## Documentation
The documentation for this project is admittedly pretty lacking, if anyone would like to put type definitions in the Python code that would be amazing and probably go a long way to helping the readability of the code. Feel free to also use the [discussion](https://github.com/jyjblrd/Mocap-Drones/discussions) tab to ask questions.

My blog post has some more information about the drones & camera: [joshuabird.com/blog/post/mocap-drones](https://joshuabird.com/blog/post/mocap-drones)

[This post](https://github.com/jyjblrd/Low-Cost-Mocap/discussions/11#discussioncomment-9380283) by gumby0q explains how `camera_params.json` can be calculated for your cameras.



## "Inside-Out" Multi-Agent Tracking (SLAM)
This motion capture system is an "outside-in" system, with external cameras tracking objects within a fixed space. There are also "inside-out" systems which use cameras on the drones/robots to determine their locations, not requiring any external infrastructure. 

My undergraduate dissertation presents such a system, which is capable of localizing multiple agents within a world in real time using purely visual data, with state-of-the-art performance. Check it out here: [https://github.com/jyjblrd/distributed_visual_SLAM](https://github.com/jyjblrd/distributed_visual_SLAM)
