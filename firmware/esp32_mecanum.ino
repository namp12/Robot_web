/**
 * 🤖 Mecanum Robot ESP32 Firmware
 * Handles 11 standardized movement commands and reports battery/status telemetry.
 */

#include <Arduino.h>
#include <Wire.h>

// --- Ultrasonic Sensor Pin Configurations ---
#define FRONT_TRIG_PIN 4
#define FRONT_ECHO_PIN 16
#define REAR_TRIG_PIN 17
#define REAR_ECHO_PIN 34

// --- Motor Pin Configurations (Example H-Bridge mapping) ---
// Front Left (FL)
#define FL_PIN_IN1 12
#define FL_PIN_IN2 13
#define FL_PIN_PWM 14
// Front Right (FR)
#define FR_PIN_IN1 27
#define FR_PIN_IN2 26
#define FR_PIN_PWM 25
// Rear Left (RL)
#define RL_PIN_IN1 33
#define RL_PIN_IN2 32
#define RL_PIN_PWM 15
// Rear Right (RR)
#define RR_PIN_IN1 19
#define RR_PIN_IN2 18
#define RR_PIN_PWM 21

// --- PWM Configurations for ESP32 ledc ---
#define PWM_FREQ 5000
#define PWM_RES 8 // 8-bit resolution (0-255)
#define LEDC_CH_FL 0
#define LEDC_CH_FR 1
#define LEDC_CH_RL 2
#define LEDC_CH_RR 3

// --- Telemetry Variables ---
unsigned long lastTelemetryTime = 0;
const unsigned long telemetryInterval = 1000; // Send telemetry every 1s

// --- MPU6050 State Variables ---
bool mpuInit = false;
double imuYaw = 0.0;
unsigned long lastIMUTime = 0;

void initMPU() {
  Wire.begin();
  Wire.beginTransmission(0x68);
  Wire.write(0x6B); // PWR_MGMT_1 register
  Wire.write(0);    // set to zero (wakes up the MPU-6050)
  byte err = Wire.endTransmission();
  if (err == 0) {
    mpuInit = true;
    lastIMUTime = millis();
    Serial.println("STATUS_IMU OK");
  } else {
    Serial.println("STATUS_IMU FAILED");
  }
}

float readDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 20000); // 20ms timeout
  if (duration == 0) return 0.0;
  float distCm = (duration * 0.0343) / 2.0;
  return distCm / 100.0; // convert to meters
}

void readIMU(float &qx, float &qy, float &qz, float &qw) {
  if (!mpuInit) {
    qx = 0.0; qy = 0.0; qz = 0.0; qw = 1.0;
    return;
  }
  
  Wire.beginTransmission(0x68);
  Wire.write(0x3B); // starting register for Accel Readings
  Wire.endTransmission(false);
  Wire.requestFrom(0x68, 14, true); // request 14 registers
  
  if (Wire.available() < 14) {
    qx = 0.0; qy = 0.0; qz = 0.0; qw = 1.0;
    return;
  }

  int16_t ax = Wire.read()<<8|Wire.read();
  int16_t ay = Wire.read()<<8|Wire.read();
  int16_t az = Wire.read()<<8|Wire.read();
  int16_t temp = Wire.read()<<8|Wire.read();
  int16_t gx = Wire.read()<<8|Wire.read();
  int16_t gy = Wire.read()<<8|Wire.read();
  int16_t gz = Wire.read()<<8|Wire.read();

  // Convert raw gyro Z to rad/s (range is +/- 250 deg/s)
  float gz_rad = (gz / 131.0) * (PI / 180.0);

  unsigned long now = millis();
  float dt = (now - lastIMUTime) / 1000.0;
  lastIMUTime = now;
  if (dt <= 0 || dt > 0.5) dt = 0.02; // bound delta time

  // Integrate yaw (z axis rotation)
  imuYaw += gz_rad * dt;

  // Simple quaternion conversion from yaw (about Z axis)
  // q = [cos(yaw/2), 0, 0, sin(yaw/2)]
  qw = cos(imuYaw / 2.0);
  qx = 0.0;
  qy = 0.0;
  qz = sin(imuYaw / 2.0);
}

void setup() {
  Serial.begin(115200);
  
  // Initialize Ultrasonic Pins
  pinMode(FRONT_TRIG_PIN, OUTPUT);
  pinMode(FRONT_ECHO_PIN, INPUT);
  pinMode(REAR_TRIG_PIN, OUTPUT);
  pinMode(REAR_ECHO_PIN, INPUT);

  // Initialize Direction Pins
  pinMode(FL_PIN_IN1, OUTPUT);
  pinMode(FL_PIN_IN2, OUTPUT);
  pinMode(FR_PIN_IN1, OUTPUT);
  pinMode(FR_PIN_IN2, OUTPUT);
  pinMode(RL_PIN_IN1, OUTPUT);
  pinMode(RL_PIN_IN2, OUTPUT);
  pinMode(RR_PIN_IN1, OUTPUT);
  pinMode(RR_PIN_IN2, OUTPUT);

  // Initialize PWM channels on ESP32
  ledcSetup(LEDC_CH_FL, PWM_FREQ, PWM_RES);
  ledcSetup(LEDC_CH_FR, PWM_FREQ, PWM_RES);
  ledcSetup(LEDC_CH_RL, PWM_FREQ, PWM_RES);
  ledcSetup(LEDC_CH_RR, PWM_FREQ, PWM_RES);

  ledcAttachPin(FL_PIN_PWM, LEDC_CH_FL);
  ledcAttachPin(FR_PIN_PWM, LEDC_CH_FR);
  ledcAttachPin(RL_PIN_PWM, LEDC_CH_RL);
  ledcAttachPin(RR_PIN_PWM, LEDC_CH_RR);

  stopMotors();

  // Initialize I2C and MPU6050
  initMPU();

  Serial.println("SYSTEM_READY");
}

void loop() {
  // Read and process serial commands from Raspberry Pi / ROS2
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      parseAndExecuteCommand(input);
    }
  }

  // Periodic Telemetry Publishing
  if (millis() - lastTelemetryTime >= telemetryInterval) {
    sendTelemetry();
    lastTelemetryTime = millis();
  }
}

// Drive a specific motor with sign indicating direction
void driveMotor(int pinIn1, int pinIn2, int ledcChannel, int targetSpeed) {
  // Clamp speed to -255 to 255
  targetSpeed = constrain(targetSpeed, -255, 255);
  
  if (targetSpeed > 0) {
    digitalWrite(pinIn1, HIGH);
    digitalWrite(pinIn2, LOW);
    ledcWrite(ledcChannel, targetSpeed);
  } else if (targetSpeed < 0) {
    digitalWrite(pinIn1, LOW);
    digitalWrite(pinIn2, HIGH);
    ledcWrite(ledcChannel, abs(targetSpeed));
  } else {
    digitalWrite(pinIn1, LOW);
    digitalWrite(pinIn2, LOW);
    ledcWrite(ledcChannel, 0);
  }
}

// Helper to quickly halt all chassis motion
void stopMotors() {
  driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, 0);
  driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, 0);
  driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, 0);
  driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, 0);
}

// Parse space separated command format: "COMMAND SPEED"
void parseAndExecuteCommand(String rawCommand) {
  int spaceIdx = rawCommand.indexOf(' ');
  String cmd = "";
  int speed = 0;

  if (spaceIdx == -1) {
    cmd = rawCommand;
    speed = 0;
  } else {
    cmd = rawCommand.substring(0, spaceIdx);
    speed = rawCommand.substring(spaceIdx + 1).toInt();
  }

  cmd.toUpperCase();
  
  // Constrain Speed to standard 8-bit PWM
  speed = constrain(speed, 0, 255);

  if (cmd == "FORWARD") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, speed);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, speed);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, speed);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, speed);
  } 
  else if (cmd == "BACKWARD") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, -speed);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, -speed);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, -speed);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, -speed);
  } 
  else if (cmd == "STRAFE_LEFT") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, -speed);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, speed);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, speed);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, -speed);
  } 
  else if (cmd == "STRAFE_RIGHT") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, speed);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, -speed);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, -speed);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, speed);
  } 
  else if (cmd == "DIAGONAL_FRONT_LEFT") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, 0);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, speed);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, speed);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, 0);
  } 
  else if (cmd == "DIAGONAL_FRONT_RIGHT") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, speed);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, 0);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, 0);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, speed);
  } 
  else if (cmd == "DIAGONAL_REAR_LEFT") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, -speed);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, 0);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, 0);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, -speed);
  } 
  else if (cmd == "DIAGONAL_REAR_RIGHT") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, 0);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, -speed);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, -speed);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, 0);
  } 
  else if (cmd == "ROTATE_LEFT") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, -speed);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, speed);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, -speed);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, speed);
  } 
  else if (cmd == "ROTATE_RIGHT") {
    driveMotor(FL_PIN_IN1, FL_PIN_IN2, LEDC_CH_FL, speed);
    driveMotor(FR_PIN_IN1, FR_PIN_IN2, LEDC_CH_FR, -speed);
    driveMotor(RL_PIN_IN1, RL_PIN_IN2, LEDC_CH_RL, speed);
    driveMotor(RR_PIN_IN1, RR_PIN_IN2, LEDC_CH_RR, -speed);
  } 
  else if (cmd == "STOP") {
    stopMotors();
  } 
  else {
    // Unknown Command
    Serial.print("ERROR_UNKNOWN_CMD: ");
    Serial.println(cmd);
  }
}

// Send Battery logs and overall chassis health telemetry via Serial
void sendTelemetry() {
  // Read battery status (mock sensors or ADC mapping)
  int batteryPercentage = 88;
  float batteryVoltage = 24.20;
  float currentDraw = 3.50;

  // Print standardized telemetry formats recognized by ROS2 serial node
  Serial.println("STATUS OK");
  
  Serial.print("BATTERY ");
  Serial.print(batteryPercentage);
  Serial.print(" ");
  Serial.print(batteryVoltage, 2);
  Serial.print(" ");
  Serial.println(currentDraw, 2);

  // Read and transmit ultrasonic sensor data (in meters)
  float frontDist = readDistance(FRONT_TRIG_PIN, FRONT_ECHO_PIN);
  float rearDist = readDistance(REAR_TRIG_PIN, REAR_ECHO_PIN);
  Serial.print("RANGE ");
  Serial.print(frontDist, 2);
  Serial.print(" ");
  Serial.println(rearDist, 2);

  // Read and transmit IMU quaternion values
  float qx, qy, qz, qw;
  readIMU(qx, qy, qz, qw);
  Serial.print("IMU ");
  Serial.print(qx, 4);
  Serial.print(" ");
  Serial.print(qy, 4);
  Serial.print(" ");
  Serial.print(qz, 4);
  Serial.print(" ");
  Serial.println(qw, 4);

  // Read and transmit mock or real Encoder values for FL, FR, RL, RR
  float encFL = 12.5;
  float encFR = 13.0;
  float encRL = 12.0;
  float encRR = 12.8;
  Serial.print("ENCODER ");
  Serial.print(encFL, 1);
  Serial.print(" ");
  Serial.print(encFR, 1);
  Serial.print(" ");
  Serial.print(encRL, 1);
  Serial.print(" ");
  Serial.println(encRR, 1);
}
