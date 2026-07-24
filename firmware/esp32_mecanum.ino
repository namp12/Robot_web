/**
 * 🤖 Mecanum Robot ESP32 Firmware
 * Handles 11 standardized movement commands and reports battery/status telemetry.
 */

#include <Arduino.h>

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

void setup() {
  Serial.begin(115200);
  
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
}
