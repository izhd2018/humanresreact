import React, { useRef, useEffect, useState } from "react";
import "./App.css";

import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import Webcam from "react-webcam";
import { drawMesh } from "./utilities";
import '@tensorflow/tfjs-backend-webgl';
import emailjs from '@emailjs/browser';


var leftTurnCount = 0;
var rightTurnCount = 0;
var awayCount = 0;
var totalscore=0;
var totaltimetaken=0;
var stop=false;
var len=0;

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const questions = [
    {
      questionText: 'A process is a ___',
      answerOptions: [
        { answerText: 'single thread of execution', isCorrect: false },
        { answerText: 'program in the execution', isCorrect: true },
        { answerText: 'program in the memory', isCorrect: false },
        { answerText: 'task', isCorrect: false },
      ],
    },
    {
      questionText: 'What is smallest unit of the information?',
      answerOptions: [
        { answerText: 'A bit', isCorrect: true },
        { answerText: 'A byte', isCorrect: false },
        { answerText: 'A block', isCorrect: false },
        { answerText: 'A nibble', isCorrect: false },
      ],
    },
    {
      questionText: 'What is the decimal equivalent of the binary number 10111?',
      answerOptions: [
        { answerText: '21', isCorrect: false },
        { answerText: '39', isCorrect: false },
        { answerText: '42', isCorrect: false },
        { answerText: '23', isCorrect: true },
      ],
    },
    {
      questionText: 'What is the term for a temporary storage area that compensates for differences in data rate and data flow between devices?',
      answerOptions: [
        { answerText: 'Buffer', isCorrect: true },
        { answerText: 'Bus', isCorrect: false },
        { answerText: 'Channel', isCorrect: false },
        { answerText: 'Modem', isCorrect: false },
      ],
    },
    {
      questionText: 'What does XML stand for?',
      answerOptions: [
        { answerText: 'eXtensible Markup Language', isCorrect: true },
        { answerText: 'eXecutable Multiple Language', isCorrect: false },
        { answerText: 'eXTra Multi-Program Language', isCorrect: false },
        { answerText: 'eXamine Multiple Language', isCorrect: false },
      ],
    },
    {
      questionText: 'How many color dots make up one color pixel on a screen?',
      answerOptions: [
        { answerText: '265', isCorrect: false },
        { answerText: '16', isCorrect: false },
        { answerText: '8', isCorrect: false },
        { answerText: '3', isCorrect: true },
      ],
    },
    {
      questionText: 'BIOS is used?',
      answerOptions: [
        { answerText: 'By operating system', isCorrect: true },
        { answerText: 'By compiler', isCorrect: false },
        { answerText: 'By interpreter', isCorrect: false },
        { answerText: 'By application software', isCorrect: false },
      ],
    },
    {
      questionText: 'Which of the following is equal to a gigabyte?',
      answerOptions: [
        { answerText: '1024 bytes', isCorrect: true },
        { answerText: '512 kilobytes', isCorrect: false },
        { answerText: '1024 megabytes', isCorrect: false },
        { answerText: '1024 bits', isCorrect: false },
      ],
    },
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerOptionClick = (isCorrect) => {
    if (isCorrect) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      len = questions.length;
      totalscore = score+1;
      stop = true;
      setShowScore(true);
    }
  }
  //  Load posenet
  const runFacemesh = async () => {

    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    const start = setInterval(() => {
      totaltimetaken++;
      if (stop) {

        var templateParams = {
          name: 'James',
          AwayTime: awayCount,
          LeftTurnTime: leftTurnCount,
          RightTurnTime: rightTurnCount,
          TotalScore: totalscore,
          TotalTimeTaken: totaltimetaken,
          TotalQuestions: len
        };

        clearInterval(start);
        emailjs.send('Zishu', 'template_6n8lwdo', templateParams,'NtksvLTYJ8MdTOzWo')
            .then(function(response) {
               console.log('SUCCESS!', response.status, response.text);
            }, function(error) {
               console.log('FAILED...', error);
            });
      }
      detect(net);

    }, 1000);

  };

  const detect = async (net) => {
    var readings = [];

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const face = await net.estimateFaces({ input: video });
      if (face.length == 0) {
        awayCount++;
      }
      else {

        if (face[0].annotations.leftCheek[0][2] > 10) {
          leftTurnCount++;
        }

        if (face[0].annotations.leftCheek[0][2] < -5) {
          rightTurnCount++;
        }

        readings.push({
          leftCheek: face[0].annotations.leftCheek,
          rigthCheek: face[0].annotations.rightCheek,
          noseTip: face[0].annotations.noseTip,
          midwayBetweenEyes: face[0].annotations.midwayBetweenEyes
        });

      }

      // Get canvas context
      const ctx = canvasRef.current.getContext("2d");
      requestAnimationFrame(() => { drawMesh(face, ctx) });
    }
  };

  useEffect(() => { runFacemesh() }, []);

  return (

    <div className="App">

      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 300,
            height: 300,
          }}
        />


        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 250,
            height: 250,
          }}
        />
      </header>
      <div className='app'>
          {showScore ? (
            <div className='score-section'>
              You scored {score} out of {questions.length}
            </div>
          ) : (
            <>
              <div className='question-section'>
                <div className='question-count'>
                  <span>Question {currentQuestion + 1}</span>/{questions.length}
                </div>
                <div className='question-text'>{questions[currentQuestion].questionText}</div>
              </div>
              <div className='answer-section'>
                {questions[currentQuestion].answerOptions.map((answerOption) => (
                  <button onClick={() => handleAnswerOptionClick(answerOption.isCorrect)}>{answerOption.answerText}</button>
                ))}
              </div>
            </>
          )}
        </div>
    </div>
  );
}

export default App;

