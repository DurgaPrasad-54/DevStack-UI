import React from "react";
import { useNavigate } from "react-router-dom";
// import "../../../stylesheets/theme.css";
// import "../../../stylesheets/alignments.css";
// import "../../../stylesheets/textelements.css";
// import "../../../stylesheets/custom-components.css";
// import "../../../stylesheets/form-elements.css";
// import "../../../stylesheets/layout.css";

function Instructions({ examData, setView, startTimer, handleStartExam }) {
  const navigate = useNavigate();
  return (
    <div>
      <style>
        {`.flex{
            display: flex;
          }
          .flex-col{
            flex-direction: column;
          }
          .items-center{
            align-items: center;
          }
          .gap-5{
            gap: 50px;
          }
          .gap-1{
            gap: 10px;
          }  
          .text-2xl{
            font-size: 1.5rem;
            line-height: 2rem;
          }
          .underline{
            text-decoration: underline !important;
          }

          .font-bold {
            font-weight: bold;
          }
          .gap-2{
            gap: 20px;
          }
          .primary-outlined-btn {
            background-color: white;
            color: #003049;
            border: 2px solid #003049;
          }
          .primary-contained-btn {
            background-color: #003049;
            color: white;
          }
          .gap-2{
            gap: 20px;
          }
        `}
      </style>
    <div className="flex flex-col items-center gap-5">
      <ul className="flex flex-col gap-1">
        <h1 className="text-2xl underline">Instructions</h1>
        <li>Exam must be completed in {examData.duration} seconds.</li>
        <li>
          Exam will be submitted automatically after {examData.duration}{" "}
          seconds.
        </li>
        <li>Once submitted, you cannot change your answers.</li>
        <li>Do not refresh the page.</li>
        <li>
          You can use the <span className="font-bold">"Previous"</span> and{" "}
          <span className="font-bold">"Next"</span> buttons to navigate between
          questions.
        </li>
        <li>
          Total marks of the exam is{" "}
          <span className="font-bold">{examData.totalMarks}</span>.
        </li>
        <li>
          Passing marks of the exam is{" "}
          <span className="font-bold">{examData.passingMarks}</span>.
        </li>
      </ul>

      <div className="flex gap-2">
        <button className="primary-outlined-btn"
         onClick={()=>navigate('/user/assignments')}
        >
              CLOSE
        </button>
        <button
          className="primary-contained-btn"
          onClick={() => {
            handleStartExam(examData._id); // Mark the exam as attempted
            startTimer();
            setView("questions");
          }}
        >
          Start Exam
        </button>
      </div>
    </div>
    </div>
  );
}

export default Instructions;
