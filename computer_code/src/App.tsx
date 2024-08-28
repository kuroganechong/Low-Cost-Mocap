"use client";

import { FormEventHandler, useState, createRef, Ref, useRef, useEffect } from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import Toolbar from './components/Toolbar';
import Form from 'react-bootstrap/Form';
import { Tooltip } from 'react-tooltip'
import CameraWireframe from './components/CameraWireframe';
import { io } from 'socket.io-client';
import { Canvas, useFrame } from '@react-three/fiber'
import { Stats, OrbitControls } from '@react-three/drei'
import Points from './components/Points';
import { socket } from './shared/styles/scripts/socket';
import { matrix, mean, multiply, rotationMatrix } from 'mathjs';
import Objects from './components/Objects';
import Chart from './components/chart';
import TrajectoryPlanningSetpoints from './components/TrajectoryPlanningSetpoints';

const TRAJECTORY_PLANNING_TIMESTEP = 0.05
const LAND_Z_HEIGHT = 0.075
const NUM_DRONES = 2

export default function App() {
  const [cameraStreamRunning, setCameraStreamRunning] = useState(false);

  const [exposure, setExposure] = useState(100);
  const [gain, setGain] = useState(0);

  const [capturingPointsForPose, setCapturingPointsForPose] = useState(false);
  const [capturedPointsForPose, setCapturedPointsForPose] = useState("");

  const [isTriangulatingPoints, setIsTriangulatingPoints] = useState(false);
  const [isLocatingObjects, setIsLocatingObjects] = useState(false);

  const objectPoints = useRef<Array<Array<Array<number>>>>([])
  const filteredObjects = useRef<object[][]>([])
  const droneSetpointHistory = useRef<number[][]>([])
  const objectPointErrors = useRef<Array<Array<number>>>([])
  const objects = useRef<Array<Array<Object>>>([])
  const [objectPointCount, setObjectPointCount] = useState(0);

  const [fps, setFps] = useState(0);

  // const [cameraPoses, setCameraPoses] = useState<Array<object>>([{ "R": [[1, 0, 0], [0, 1, 0], [0, 0, 1]], "t": [0, 0, 0] }, { "R": [[-0.0008290000610233772, -0.7947131755287576, 0.6069845808584402], [0.7624444396180684, 0.3922492478955913, 0.5146056781855716], [-0.6470531579819294, 0.46321862674804054, 0.6055994671226776]], "t": [-2.6049886186449047, -2.173986915510569, 0.7303458563542193] }, { "R": [[-0.9985541623963866, -0.028079891357569067, -0.045837806036037466], [-0.043210651917521686, -0.08793122558361385, 0.9951888962042462], [-0.03197537054848707, 0.995730696156702, 0.0865907408997996]], "t": [0.8953888630067902, -3.4302652822708373, 3.70967106300893] }, { "R": [[-0.4499864100408215, 0.6855400696798954, -0.5723172578577878], [-0.7145273934510732, 0.10804105689305427, 0.6912146801345055], [0.5356891214002657, 0.7199735709654319, 0.4412201517663212]], "t": [2.50141072072536, -2.313616767292231, 1.8529907514099284] }])
  const [cameraPoses, setCameraPoses] = useState<Array<object>>(
    [{"R":[[1,0,0],[0,1,0],[0,0,1]],"t":[0,0,0]},{"R":[[-0.40560849528289317,0.7275084250721988,-0.5533653765852322],[-0.4610843981237962,0.3598806793656313,0.8111023822096372],[0.7892293243165536,0.5841381583737707,0.18947212346552667]],"t":[0.3691257698151714,-0.6926901365474062,0.35360121917128773]},{"R":[[-0.9418272731206885,-0.19718494593364627,0.2721754667547994],[0.23149938956561245,0.20648760619196713,0.9506686600071865],[-0.2436584089187089,0.9583741261043393,-0.1488274644578316]],"t":[-0.10404348796633804,-0.8314381582394181,0.9009552853154561]},{"R":[[0.5988729471428257,-0.34479698842054657,0.7228182551351257],[0.4014211194639086,0.9102394872791101,0.10161279764972986],[-0.6929735045647911,0.22930135754936998,0.6835265974321755]],"t":[-0.5538946323488616,-0.19025629553242868,0.32448195262472584]}]
  )
  const [toWorldCoordsMatrix, setToWorldCoordsMatrix] = useState<number[][]>(
    [[-0.26166947530478474,0.9516627599903993,-0.1608324499010519,0.47450403605101366],[-0.9516627599903992,-0.2821717363545147,-0.12131406534336416,-0.04360736251575685],[0.1608324499010519,-0.12131406534336418,-0.9794977389502701,0.9528498274941962],[0,0,0,1]]
  )

  const [currentDroneIndex, setCurrentDroneIndex] = useState(0)
  const [droneArmed, setDroneArmed] = useState(Array.apply(null, Array(NUM_DRONES)).map(() => (false)))
  const [dronePID, setDronePID] = useState(["1", "0", "0", "1.5", "0", "0", "0.3", "0.1", "0.05", "0.2", "0.03", "0.05", "0.3", "0.1", "0.05", "28", "-0.035"])
  const [droneSetpoint, setDroneSetpoint] = useState(Array.apply(null, Array(NUM_DRONES)).map(() => (["0", "0", "0"])))
  const [droneSetpointWithMotion, setDroneSetpointWithMotion] = useState([0, 0, 0])
  const [droneTrim, setDroneTrim] = useState(["0", "0", "0", "0"])

  const [motionPreset, setMotionPreset] = useState(["setpoint", "setpoint"])

  const [trajectoryPlanningMaxVel, setTrajectoryPlanningMaxVel] = useState(["1", "1", "1"])
  const [trajectoryPlanningMaxAccel, setTrajectoryPlanningMaxAccel] = useState(["1", "1", "1"])
  const [trajectoryPlanningMaxJerk, setTrajectoryPlanningMaxJerk] = useState(["0.5", "0.5", "0.5"])
  // const [trajectoryPlanningWaypoints, setTrajectoryPlanningWaypoints] = useState("[0.2,0.2,0.5,true],\n[-0.2,0.2,0.5,true],\n[-0.2,0.2,0.8,true],\n[-0.2,-0.2,0.8,true],\n[-0.2,-0.2,0.5,true],\n[0.2,-0.2,0.5,true],\n[0.2,-0.2,0.8,true],\n[0.2,0.2,0.8,true],\n[0.2,0.2,0.5,true]\n]")
  const [trajectoryPlanningWaypoints, setTrajectoryPlanningWaypoints] = useState("[\n[0.2,0.2,0.6,0,0,0.8,true],\n[-0.2,0.2,0.6,0.2,0.2,0.6,true],\n[-0.2,-0.2,0.5,0,0,0.4,true],\n[0.2,-0.2,0.5,-0.2,-0.2,0.6,true],\n[0.2,0.2,0.5,0,0,0.8,true]\n]")
  const [trajectoryPlanningSetpoints, setTrajectoryPlanningSetpoints] = useState<number[][][]>([])
  const [trajectoryPlanningRunStartTimestamp, setTrajectoryPlanningRunStartTimestamp] = useState(0)

  const updateCameraSettings: FormEventHandler = (e) => {
    e.preventDefault()
    socket.emit("update-camera-settings", {
      exposure,
      gain,
    })
  }

  const [CaptureOnToggle, setCaptureOnToggle] = useState(false)
  const sendToggleCaptureOn = async () => {
    socket.emit("toggle-capture-on", {})
  }
  const sendSingleCapture = async () => {
    socket.emit("single-capture", {})
  }

  const capturePointsForPose = async (startOrStop: string) => {
    if (startOrStop === "start") {
      setCapturedPointsForPose("")
    }
    socket.emit("capture-points", { startOrStop })
  }

  useEffect(() => {
    socket.on("image-points", (data) => {
      setCapturedPointsForPose(`${capturedPointsForPose}${JSON.stringify(data)},`)
    })

    return () => {
      socket.off("image-points")
    }
  }, [capturedPointsForPose])

  useEffect(() => {
    let count = 0
    socket.emit("arm-drone", { droneArmed, count, currentDroneIndex })
    const pingInterval = setInterval(() => {
      count += 1
      socket.emit("arm-drone", { droneArmed, count, currentDroneIndex })
    }, 500)

    return () => {
      clearInterval(pingInterval)
    }
  }, [droneArmed])

  useEffect(() => {
    for (let droneIndex = 0; droneIndex < NUM_DRONES; droneIndex++) {
      socket.emit("set-drone-pid", { dronePID, droneIndex })
    }
  }, [dronePID])

  useEffect(() => {
    socket.emit("set-drone-trim", { droneTrim, droneIndex: currentDroneIndex })
  }, [droneTrim])

  useEffect(() => {
    let timestamp = Date.now() / 1000
    let motionIntervals: NodeJS.Timer[] = []

    for (let droneIndex = 0; droneIndex < NUM_DRONES; droneIndex++) {
      if (motionPreset[droneIndex] !== "setpoint") {
        motionIntervals.push(setInterval(() => {
          timestamp = Date.now() / 1000
          let tempDroneSetpoint = [] as number[]

          switch (motionPreset[droneIndex]) {
            case "none": {
              break;
            }

            case "circle": {
              const radius = 0.3
              const period = 10

              let tempDroneSetpoint: number[] = []

              // drones doing circles demo
              switch (droneIndex) {
                case 0: {
                  tempDroneSetpoint = [
                    radius * Math.cos(timestamp * 2 * Math.PI / period),
                    radius * Math.sin(timestamp * 2 * Math.PI / period),
                    parseFloat(droneSetpoint[droneIndex][2])
                  ]
                  break;
                }

                case 1: {
                  tempDroneSetpoint = [
                    0,
                    radius * Math.cos(timestamp * 2 * Math.PI / period),
                    parseFloat(droneSetpoint[droneIndex][2]) + radius * Math.sin(timestamp * 2 * Math.PI / period)
                  ]
                  break;
                }
              }
              tempDroneSetpoint.map(x => x.toFixed(3))
              socket.emit("set-drone-setpoint", { "droneSetpoint": tempDroneSetpoint, droneIndex })
              break;
            }

            case "square": {
              const size = 0.2
              const period = 20
              let offset = [0, 0]
              switch (Math.floor((timestamp * 4) / period) % 4) {
                case 0:
                  offset = [1, 1]
                  break
                case 1:
                  offset = [1, -1]
                  break
                case 2:
                  offset = [-1, -1]
                  break
                case 3:
                  offset = [-1, 1]
                  break
              }

              tempDroneSetpoint = [
                parseFloat(droneSetpoint[droneIndex][0]) + (offset[0] * size),
                parseFloat(droneSetpoint[droneIndex][1]) + (offset[1] * size),
                parseFloat(droneSetpoint[droneIndex][2])
              ]
              tempDroneSetpoint.map(x => x.toFixed(3))
              socket.emit("set-drone-setpoint", { "droneSetpoint": tempDroneSetpoint, droneIndex })
              break;
            }

            case "plannedTrajectory": {
              const index = Math.floor((timestamp - trajectoryPlanningRunStartTimestamp) / TRAJECTORY_PLANNING_TIMESTEP)
              if (index < trajectoryPlanningSetpoints.length) {
                tempDroneSetpoint = trajectoryPlanningSetpoints[droneIndex][index]
                tempDroneSetpoint.map(x => x.toFixed(3))
                socket.emit("set-drone-setpoint", { "droneSetpoint": tempDroneSetpoint, droneIndex })
              }
              else {
                let newMotionPreset = motionPreset.slice()
                newMotionPreset[droneIndex] = "setpoint"
                setMotionPreset(newMotionPreset)
              }
              break;
            }

            default:
              break;
          }

          if (droneIndex === currentDroneIndex) {
            setDroneSetpointWithMotion(tempDroneSetpoint)
          }
        }, TRAJECTORY_PLANNING_TIMESTEP * 1000))
      }
      else {
        if (droneIndex === currentDroneIndex) {
          setDroneSetpointWithMotion(droneSetpoint[droneIndex].map(x => parseFloat(x)))
        }
        socket.emit("set-drone-setpoint", { "droneSetpoint": droneSetpoint[droneIndex], droneIndex })
      }
    }

    return () => {
      motionIntervals.forEach(motionInterval => {
        clearInterval(motionInterval)
      })
    }
  }, [motionPreset, droneSetpoint, trajectoryPlanningRunStartTimestamp])

  useEffect(() => {
    socket.on("to-world-coords-matrix", (data) => {
      setToWorldCoordsMatrix(data["to_world_coords_matrix"])
      setObjectPointCount(objectPointCount + 1)
    })

    return () => {
      socket.off("to-world-coords-matrix")
    }
  }, [objectPointCount])

  useEffect(() => {
    socket.on("object-points", (data) => {
      objectPoints.current.push(data["object_points"])
      if (data["filtered_objects"].length != 0) {
        filteredObjects.current.push(data["filtered_objects"])
      }
      objectPointErrors.current.push(data["errors"])
      objects.current.push(data["objects"])
      droneSetpointHistory.current.push(droneSetpointWithMotion)
      setObjectPointCount(objectPointCount + 1)
    })

    return () => {
      socket.off("object-points")
    }
  }, [objectPointCount])

  useEffect(() => {
    socket.on("camera-pose", data => {
      console.log(data["camera_poses"])
      setCameraPoses(data["camera_poses"])
    })

    return () => {
      socket.off("camera-pose")
    }
  }, [])

  useEffect(() => {
    socket.on("fps", data => {
      setFps(data["fps"])
    })

    return () => {
      socket.off("fps")
    }
  }, [])

  const planTrajectory = async (waypoints: object, maxVel: number[], maxAccel: number[], maxJerk: number[], timestep: number) => {
    const location = window.location.hostname;
    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        waypoints,
        maxVel,
        maxAccel,
        maxJerk,
        timestep
      })
    };
    const fetchResponse = await fetch(`http://localhost:3001/api/trajectory-planning`, settings);
    const data = await fetchResponse.json();

    return data.setpoints
  }

  const wait = async (ms: number) => new Promise(r => setTimeout(r, ms))

  // const moveToPos = async (pos: number[], droneIndex: number) => {
  //   console.log(filteredObjects.current[filteredObjects.current.length - 1][droneIndex])
  //   const waypoints = [
  //     filteredObjects.current[filteredObjects.current.length - 1][droneIndex]["pos"].concat([true]),
  //     pos.concat([true])
  //   ]
  //   const setpoints = await planTrajectory(
  //     waypoints,
  //     trajectoryPlanningMaxVel.map(x => parseFloat(x)),
  //     trajectoryPlanningMaxAccel.map(x => parseFloat(x)),
  //     trajectoryPlanningMaxJerk.map(x => parseFloat(x)),
  //     TRAJECTORY_PLANNING_TIMESTEP
  //   )

  //   for await (const [i, setpoint] of setpoints.entries()) {
  //     setpoint.map(x => x.toFixed(3))
  //     socket.emit("set-drone-setpoint", { "droneSetpoint": setpoint, droneIndex })
  //     setDroneSetpointWithMotion(setpoint)

  //     // if (land && i > 0.75*setpoints.length && filteredObjects.current[filteredObjects.current.length-1]["vel"][2] >= -0.2) {
  //     //   setDroneArmed(false)
  //     // }

  //     await wait(TRAJECTORY_PLANNING_TIMESTEP * 1000)
  //   }
  // }

  const calculateCameraPose = async (cameraPoints: Array<Array<Array<number>>>) => {
    socket.emit("calculate-camera-pose", { cameraPoints })
  }

  const isValidJson = (str: string) => {
    try {
      const o = JSON.parse(str);
      if (o && typeof o === "object") {
        return true;
      }
    } catch (e) { }
    return false;
  }

  const startLiveMocap = (startOrStop: string) => {
    socket.emit("triangulate-points", { startOrStop, cameraPoses, toWorldCoordsMatrix })
  }

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
                <img src={cameraStreamRunning ? "http://localhost:3001/api/camera-stream" : ""} />
              </Col>
            </Row>

            {/* Title and content for camera settings */}
            <Row>
              <Col xs="auto">
                <h4>Camera Settings</h4>
              </Col>
            </Row>
            <Row className='pt-3'>
              {/* Exposure and Gain */}
              <Col xs="4">
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
                      disabled={!cameraStreamRunning}
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
                {/* Collect Points for Pose */}
                <Row>
                  <Col xs="auto">
                    <h4>1. Collect points for camera pose calibration</h4>
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
                    <h4>2. Set Scale Using Two 15cm Markers</h4>
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
                    <h4>3. Acquire Floor from One Marker</h4>
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
                    <h4>4. Set Origin from One Marker</h4>
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
                          droneSetpointHistory.current = []
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
                <h4>Scene Viewer {objectPointErrors.current.length !== 0 ? mean(objectPointErrors.current.flat()) : ""}</h4>
              </Col>
            </Row>
            <Row>
              <Col style={{ height: "600px" }}>
                <Canvas orthographic camera={{ zoom: 1000, position: [0, 0, 10] }}>
                  <ambientLight />
                  {cameraPoses.map(({ R, t }, i) => (
                    <CameraWireframe R={R} t={t} toWorldCoordsMatrix={toWorldCoordsMatrix} key={i} />
                  ))}
                  <Points objectPointsRef={objectPoints} objectPointErrorsRef={objectPointErrors} count={objectPointCount} />
                  <Objects filteredObjectsRef={filteredObjects} count={objectPointCount} />
                  <TrajectoryPlanningSetpoints trajectoryPlanningSetpoints={trajectoryPlanningSetpoints} NUM_DRONES={NUM_DRONES} />
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
                <Chart filteredObjectsRef={filteredObjects} droneSetpointHistoryRef={droneSetpointHistory} objectPointCount={objectPointCount} dronePID={dronePID.map(x => parseFloat(x))} droneArmed={droneArmed} currentDroneIndex={currentDroneIndex} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
