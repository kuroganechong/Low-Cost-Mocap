"use client";

import { FormEventHandler, useState, useRef, useEffect } from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { Tooltip } from 'react-tooltip'
import CameraWireframe from './components/CameraWireframe';
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Points from './components/Points';
import { socket } from './shared/styles/scripts/socket';
import Objects from './components/Objects';
import { FilteredObject } from './components/Objects';
import Chart from './components/chart';
import { mean } from 'mathjs';

type CameraPose = {
  R: number[][];
  t: number[];
};

export default function App() {
  const [cameraStreamRunning, setCameraStreamRunning] = useState(false);
  const [fps, setFps] = useState(0);

  const [exposure, setExposure] = useState(100);
  const [gain, setGain] = useState(0);

  const [capturingPointsForPose, setCapturingPointsForPose] = useState(false);
  const [capturedPointsForPose, setCapturedPointsForPose] = useState("");

  const [isTriangulatingPoints, setIsTriangulatingPoints] = useState(false);
  const [isLocatingObjects, setIsLocatingObjects] = useState(false);

  const objectPoints = useRef<Array<Array<Array<number>>>>([])
  const filteredObjects = useRef<FilteredObject[]>([])
  const objectPointErrors = useRef<Array<Array<number>>>([])
  const objects = useRef<Array<Array<Object>>>([])
  const [objectPointCount, setObjectPointCount] = useState(0);

  const [isPointsVisible, setIsPointsVisible] = useState(true);
  const [isObjectsVisible, setIsObjectsVisible] = useState(true);

  // Default poses and world coords matrix
  const [cameraPoses, setCameraPoses] = useState<CameraPose[]>(
    [{"R":[[1,0,0],[0,1,0],[0,0,1]],"t":[0,0,0]},{"R":[[0.05776126790771352,-0.2843485138109171,0.9569793929982067],[0.47261052786141267,0.8521505286711784,0.2246747992988714],[-0.8793764409422453,0.43930103480296284,0.18360739619306132]],"t":[-0.7411819352313582,-0.41930587473577774,0.5805408312022435]},{"R":[[-0.9918337919488464,0.01971366878901075,0.12600436663564374],[0.1124233537397087,0.6016603262191634,0.7908007596024211],[-0.06022224408214024,0.7985087495555243,-0.5989633195789071]],"t":[-0.09795638972476488,-0.8254183963120538,1.200242974862005]},{"R":[[-0.17595487280860578,0.45372936477077336,-0.8735957567889271],[-0.4178886397419738,0.7690809266246187,0.4836151497594148],[0.8912962288204246,0.45016018465311747,0.054284810431288855]],"t":[0.7281356959285753,-0.5979363938362118,0.5898083898618575]}]
  )
  const [toWorldCoordsMatrix, setToWorldCoordsMatrix] = useState<number[][]>(
    [[-0.26166947530478474,0.9516627599903993,-0.1608324499010519,0.47450403605101366],[-0.9516627599903992,-0.2821717363545147,-0.12131406534336416,-0.04360736251575685],[0.1608324499010519,-0.12131406534336418,-0.9794977389502701,0.9528498274941962],[0,0,0,1]]
  )

  // Update camera exposure and gain
  const updateCameraSettings: FormEventHandler = (e) => {
    e.preventDefault()
    socket.emit("update-camera-settings", {
      exposure,
      gain,
    })
  }

  // Control continuous capture or single capture for Camera Pose Calibration, Scale Determination, Acquire Floor, Set Origin, Live Triangulation, Locate Objects
  const [CaptureOnToggle, setCaptureOnToggle] = useState(false)
  const sendToggleCaptureOn = async () => {
    socket.emit("toggle-capture-on", {})
  }
  const sendSingleCapture = async () => {
    socket.emit("single-capture", {})
  }

  // Start or stop points collection for camera pose calibration
  const capturePointsForPose = async (startOrStop: string) => {
    if (startOrStop === "start") {
      setCapturedPointsForPose("")
    }
    socket.emit("capture-points", { startOrStop })
  }

  // Calculate camera pose from collected points
  const calculateCameraPose = async (cameraPoints: Array<Array<Array<number>>>) => {
    socket.emit("calculate-camera-pose", { cameraPoints })
  }

  // Helper function to check if a string is a valid JSON
  const isValidJson = (str: string) => {
    try {
      const o = JSON.parse(str);
      if (o && typeof o === "object") {
        return true;
      }
    } catch (e) { }
    return false;
  }

  // Start or stop live triangulation
  const startLiveMocap = (startOrStop: string) => {
    socket.emit("triangulate-points", { startOrStop, cameraPoses, toWorldCoordsMatrix })
  }

  // Receive image points from server
  useEffect(() => {
    socket.on("image-points", (data) => {
      setCapturedPointsForPose(`${capturedPointsForPose}${JSON.stringify(data)},`)
    })

    return () => {
      socket.off("image-points")
    }
  }, [capturedPointsForPose])

  // Receive object points from server
  useEffect(() => {
    socket.on("object-points", (data) => {
      objectPoints.current.push(data["object_points"])
      if (data["filtered_objects"].length != 0) {
        filteredObjects.current.push(data["filtered_objects"])
      }
      objectPointErrors.current.push(data["errors"])
      objects.current.push(data["objects"])
      setObjectPointCount(objectPointCount + 1)
    })

    return () => {
      socket.off("object-points")
    }
  }, [objectPointCount])

  // Receive calculated camera pose from server
  useEffect(() => {
    socket.on("camera-pose", data => {
      console.log(data["camera_poses"])
      setCameraPoses(data["camera_poses"])
    })

    return () => {
      socket.off("camera-pose")
    }
  }, [])

  // Receive calculated world coords matrix from server
  useEffect(() => {
    socket.on("to-world-coords-matrix", (data) => {
      setToWorldCoordsMatrix(data["to_world_coords_matrix"])
      setObjectPointCount(objectPointCount + 1)
    })

    return () => {
      socket.off("to-world-coords-matrix")
    }
  }, [objectPointCount])

  // Receive fps calculated from server
  useEffect(() => {
    socket.on("fps", data => {
      setFps(data["fps"])
    })

    return () => {
      socket.off("fps")
    }
  }, [])

  return (
    <Container fluid>
      {/* Title */}
      <Row className="pt-3" style={{ alignItems: 'center' }}>
        <Col style={{ width: 'fit-content' }} md="auto">
          <h3>MoCap</h3>
        </Col>
      </Row>

      <Row className='pt-3'>
        {/* This column contains camera and settings */}
        <Col xs="6">
          <Card className='shadow-sm p-3'>
            {/* Title and content for camera stream */}
            <Row>
              <Col xs="auto">
                <h4>Camera Stream</h4>
              </Col>
              <Col>
               {/* @ts-ignore */}
                <Button
                  size='sm'
                  className='me-3'
                  variant={cameraStreamRunning ? "outline-danger" : "outline-primary"}
                  onClick={() => {
                    setCameraStreamRunning(!cameraStreamRunning);
                  }}
                >
                  {cameraStreamRunning ? "Stop" : "Start"}
                </Button>
                FPS: {fps}
              </Col>
            </Row>
            <Row className='mt-2 mb-1' style={{ height: "640px" }}>
              <Col>
                <img src={cameraStreamRunning ? "http://localhost:3001/api/camera-stream" : ""} style={{ width: "auto", height: "640px" }}/>
              </Col>
            </Row>

            {/* Title and content for camera settings */}
            <Row className='pt-3'>
              {/* Exposure and Gain */}
              <Col xs="4">
                <Row>
                  <Col xs="auto">
                    <h4>Camera Settings</h4>
                  </Col>
                </Row>
                <Form onChange={updateCameraSettings} className='ps-3'>
                  <Form.Group className="mb-1">
                    <Form.Label>Exposure: {exposure}</Form.Label>
                    <Form.Range value={exposure} onChange={(event) => setExposure(parseFloat(event.target.value))} />
                  </Form.Group>
                  <Form.Group className="mb-1">
                    <Form.Label>Gain: {gain}</Form.Label>
                    <Form.Range value={gain} onChange={(event) => setGain(parseFloat(event.target.value))} />
                  </Form.Group>
                </Form>

                <Row>
                  <Col xs="auto">
                    <h4>Continuous Capture</h4>
                  </Col>
                  <Col>
                    <Button
                      size='sm'
                      disabled={!cameraStreamRunning}
                      variant={!CaptureOnToggle ? "outline-danger" : "outline-primary"}
                      onClick={() => {
                        setCaptureOnToggle(!CaptureOnToggle);
                        sendToggleCaptureOn();                      
                      }
                      }>
                      {CaptureOnToggle ? "On" : "Off"}
                    </Button>
                  </Col>
                </Row>

                <Row>
                  <Col xs="auto">
                    <h4>Single Frame capture</h4>
                  </Col>
                  <Col>
                    <Button
                      size='sm'
                      variant={"outline-primary"}
                      disabled={!cameraStreamRunning || !CaptureOnToggle}
                      onClick={() => {
                        sendSingleCapture();                      
                      }
                      }>
                      Capture Once
                    </Button>
                  </Col>
                </Row>
              </Col>
              {/* Rest of the settings */}
              <Col xs="8">
                <Row>
                  <Col xs="auto">
                    <h4>Calibration</h4>
                  </Col>
                </Row>
                {/* Collect Points for Pose */}
                <Row>
                  <Col xs="auto">
                    <p>1. Collect points for camera pose calibration</p>
                  </Col>
                  <Col>
                    <Tooltip id="collect-points-for-pose-button-tooltip" />
                    <a data-tooltip-hidden={cameraStreamRunning} data-tooltip-variant='error' data-tooltip-id='collect-points-for-pose-button-tooltip' data-tooltip-content="Start camera stream first">
                      <Button
                        size='sm'
                        variant={capturingPointsForPose ? "outline-danger" : "outline-primary"}
                        disabled={!cameraStreamRunning}
                        onClick={() => {
                          setCapturingPointsForPose(!capturingPointsForPose);
                          capturePointsForPose(capturingPointsForPose ? "stop" : "start");
                        }
                        }>
                        {capturingPointsForPose ? "Stop" : "Start"}
                      </Button>
                    </a>
                  </Col>
                  <Col xs="3">
                    <Button
                      size='sm'
                      variant="outline-primary"
                      disabled={!(isValidJson(`[${capturedPointsForPose.slice(0, -1)}]`) && JSON.parse(`[${capturedPointsForPose.slice(0, -1)}]`).length !== 0)}
                      onClick={() => {
                        calculateCameraPose(JSON.parse(`[${capturedPointsForPose.slice(0, -1)}]`))
                      }}>
                      Calculate Camera Pose with {isValidJson(`[${capturedPointsForPose.slice(0, -1)}]`) ? JSON.parse(`[${capturedPointsForPose.slice(0, -1)}]`).length : 0} points
                    </Button>
                  </Col>
                </Row>
                {/* Set Scale */}
                <Row>
                  <Col xs="auto">
                    <p>2. Set Scale Using Two 15cm Markers</p>
                  </Col>
                  <Col>
                    <Button
                      size='sm'
                      variant="outline-primary"
                      disabled={!isTriangulatingPoints && objectPoints.current.length == 0}
                      onClick={() => {
                        socket.emit("determine-scale", { objectPoints: objectPoints.current, cameraPoses: cameraPoses })
                      }
                      }>
                      Run
                    </Button>
                  </Col>
                </Row>
                {/* Acquire Floor */}
                <Row>
                  <Col xs="auto">
                    <p>3. Acquire Floor from One Marker</p>
                  </Col>
                  <Col>
                    <Button
                      size='sm'
                      variant="outline-primary"
                      disabled={!isTriangulatingPoints && objectPoints.current.length == 0}
                      onClick={() => {
                        socket.emit("acquire-floor", { objectPoints: objectPoints.current })
                      }
                      }>
                      Run
                    </Button>
                  </Col>
                </Row>
                {/* Set Origin */}
                <Row>
                  <Col xs="auto">
                    <p>4. Set Origin from One Marker</p>
                  </Col>
                  <Col>
                    <Button
                      size='sm'
                      variant="outline-primary"
                      disabled={!isTriangulatingPoints && objectPoints.current.length == 0}
                      onClick={() => {
                        socket.emit("set-origin", { objectPoint: objectPoints.current[0][0], toWorldCoordsMatrix })
                      }
                      }>
                      Run
                    </Button>
                  </Col>
                </Row>
                <Row style={{ height: "15px" }}>
                </Row>
                {/* Live Triangulation */}
                <Row>
                  <Col xs="auto">
                    <h4>Live Triangulation</h4>
                  </Col>
                  <Col>
                    <Button
                      size='sm'
                      variant={isTriangulatingPoints ? "outline-danger" : "outline-primary"}
                      disabled={!cameraStreamRunning}
                      onClick={() => {
                        if (!isTriangulatingPoints) {
                          objectPoints.current = []
                          objectPointErrors.current = []
                          objects.current = []
                          filteredObjects.current = []
                          // droneSetpointHistory.current = []
                        }
                        setIsTriangulatingPoints(!isTriangulatingPoints);
                        startLiveMocap(isTriangulatingPoints ? "stop" : "start");
                      }
                      }>
                      {isTriangulatingPoints ? "Stop" : "Start"}
                    </Button>
                  </Col>
                </Row>
                {/* Locate Objects */}
                <Row>
                  <Col xs="auto">
                    <h4>Locate Objects</h4>
                  </Col>
                  <Col>
                    <Button
                      size='sm'
                      variant={isLocatingObjects ? "outline-danger" : "outline-primary"}
                      disabled={!cameraStreamRunning}
                      onClick={() => {
                        setIsLocatingObjects(!isLocatingObjects);
                        socket.emit("locate-objects", { startOrStop: isLocatingObjects ? "stop" : "start" })
                      }
                      }>
                      {isLocatingObjects ? "Stop" : "Start"}
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* List of camera Pose for copy */}
            <Row className='pt-3'>
              <Col xs={4} className='pt-2'>
                Camera Poses:
              </Col>
              <Col>
                <Form.Control
                  value={JSON.stringify(cameraPoses)}
                  onChange={(event) => setCameraPoses(JSON.parse(event.target.value))}
                />
              </Col>
            </Row>
            {/* List of World Matrix for copy */}
            <Row>
              <Col xs={4} className='pt-2'>
                To World Matrix:
              </Col>
              <Col>
                <Form.Control
                  value={JSON.stringify(toWorldCoordsMatrix)}
                  onChange={(event) => setToWorldCoordsMatrix(JSON.parse(event.target.value))}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* This column contains scene viewer and chart */}
        <Col xs="6">
          <Card className='shadow-sm p-3'>
            {/* Title and content for scene viewer */}
            <Row>
              <Col xs="auto">
                <h4>Scene Viewer</h4>
              </Col>
              <Col>
                <Button
                  size='sm'
                  className='me-3'
                  variant={isPointsVisible ? "outline-danger" : "outline-primary"}
                  onClick={() => {
                    setIsPointsVisible(!isPointsVisible);
                  }}
                >Toggle Points</Button>
                <Button
                  size='sm'
                  className='me-3'
                  variant={isObjectsVisible ? "outline-danger" : "outline-primary"}
                  onClick={() => {
                    setIsObjectsVisible(!isObjectsVisible);
                  }}
                >Toggle Objects</Button>
              </Col>
              <Col xs="auto">
                <h4>Mean error: {objectPointErrors.current.length !== 0 ? mean(objectPointErrors.current.flat()) : ""}</h4>
              </Col>
            </Row>
            <Row>
              <Col style={{ height: "640px" }}>
                <Canvas orthographic camera={{ zoom: 1000, position: [0, 0, 10] }}>
                  <ambientLight />
                  {cameraPoses.map(({ R, t }, i) => (
                    <CameraWireframe R={R} t={t} toWorldCoordsMatrix={toWorldCoordsMatrix} key={i} />
                  ))}
                  <Points objectPointsRef={objectPoints} objectPointErrorsRef={objectPointErrors} count={objectPointCount} isPointsVisible={isPointsVisible} />
                  <Objects filteredObjectsRef={filteredObjects} count={objectPointCount} isObjectsVisible={isObjectsVisible} />
                  <OrbitControls />
                  <axesHelper args={[0.2]} />
                  <gridHelper args={[4, 4 * 10]} />
                  <directionalLight />
                </Canvas>
              </Col>
            </Row>

            {/* Content for chart */}
            <Row className='pt-3'>
              <Col>
                {/* <Chart filteredObjectsRef={filteredObjects} droneSetpointHistoryRef={droneSetpointHistory} objectPointCount={objectPointCount} 
                dronePID={dronePID.map(x => parseFloat(x))} droneArmed={droneArmed} currentDroneIndex={currentDroneIndex} /> */}
                <Chart filteredObjectsRef={filteredObjects} objectPointCount={objectPointCount} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
