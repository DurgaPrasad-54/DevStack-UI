import { Form, message, Modal } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
// import { addQuestionToExam, editQuestionById } from "../../../apicalls/exams";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import axios from "axios";
import config from "../../../../config";

// Axios Instance with Token
const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// add question to exam

export const addQuestionToExam = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/add-question-to-exam`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const editQuestionById = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/edit-question-in-exam`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

function AddEditQuestion({
  showAddEditQuestionModal,
  setShowAddEditQuestionModal,
  refreshData,
  examId,
    selectedQuestion,
    setSelectedQuestion
}) {
  const dispatch = useDispatch();
  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      const requiredPayload = {
        name: values.name,
        correctOption: values.correctOption,
        options: {
          A: values.A,
          B: values.B,
          C: values.C,
          D: values.D,
        },
        exam: examId,
      };

      let response
        if(selectedQuestion){
            response = await editQuestionById({
                ...requiredPayload,
                questionId: selectedQuestion._id
            })
        }
        else{
            response = await addQuestionToExam(requiredPayload);
        }
      if (response.success) {
        message.success(response.message);
        refreshData();
        setShowAddEditQuestionModal(false);
      } else {
        message.error(response.message);
      }
      setSelectedQuestion(null)
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  return (
    <>
      <style>
        {`
          .flex {
            display: flex;
          }
          .gap-3 {
            gap: 1rem; 
          }
          .justify-end {
            justify-content: flex-end;
          }
          .mt-2 {
            margin-top: 0.5rem; 
          }
            .primary-contained-btn {
  background-color: #003049;
  color: white;
}

.primary-outlined-btn {
  background-color: white;
  color: #003049;
  border: 2px solid #003049;
}
        `}
      </style>
    <Modal
      title={selectedQuestion ? "Edit Question" : "Add Question"}
      visible={showAddEditQuestionModal}
      footer={false}
      onCancel={() => {
        setShowAddEditQuestionModal(false)
        setSelectedQuestion(null)
      }}
    >
      <Form onFinish={onFinish} layout="vertical"
      initialValues={{
          name: selectedQuestion?.name,
          A: selectedQuestion?.options?.A,
          B: selectedQuestion?.options?.B,
          C: selectedQuestion?.options?.C,
          D: selectedQuestion?.options?.D,
          correctOption: selectedQuestion?.correctOption,
      }}
>
    <Form.Item name="name" label="Question">
        <input type="text" style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #003049',
            borderRadius: '4px',
            fontSize: '16px',
            transition: 'border-color 0.3s'
        }} />
    </Form.Item>
    
    <Form.Item name="correctOption" label="Correct Option">
        <select style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #003049',
            borderRadius: '4px',
            fontSize: '16px',
            transition: 'border-color 0.3s'
        }}>
            <option value="">Select Correct Option</option>
            <option value="A">Option A</option>
            <option value="B">Option B</option>
            <option value="C">Option C</option>
            <option value="D">Option D</option>
        </select>
    </Form.Item>

    <div className="flex gap-3">
        <Form.Item name="A" label="Option A">
            <input type="text" style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #003049',
                borderRadius: '4px',
                fontSize: '16px',
                transition: 'border-color 0.3s'
            }} />
        </Form.Item>
        <Form.Item name="B" label="Option B">
            <input type="text" style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #003049',
                borderRadius: '4px',
                fontSize: '16px',
                transition: 'border-color 0.3s'
            }} />
        </Form.Item>
    </div>
    <div className="flex gap-3">
        <Form.Item name="C" label="Option C">
            <input type="text" style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #003049',
                borderRadius: '4px',
                fontSize: '16px',
                transition: 'border-color 0.3s'
            }} />
        </Form.Item>
        <Form.Item name="D" label="Option D">
            <input type="text" style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #003049',
                borderRadius: '4px',
                fontSize: '16px',
                transition: 'border-color 0.3s'
            }} />
        </Form.Item>
    </div>

    <div className="flex justify-end gap-3 mt-2">
        <button
            className="primary-outlined-btn"
            type="button"
            onClick={() => setShowAddEditQuestionModal(false)}
        >
            Cancel
        </button>
        <button className="primary-contained-btn">
            Save
        </button>
    </div>
</Form>
    </Modal>
    </>
  );
}

export default AddEditQuestion;
