import { useState } from "react";
import { X } from "lucide-react";

interface SurveyQuestion {
  _id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface Survey {
  _id?: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

interface ResponseItem {
  questionId: string;
  questionText: string;
  answer: string | string[];
}

interface SurveyResponseModalProps {
  survey: Survey;
  onClose: () => void;
  onSubmit: (responses: ResponseItem[]) => void;
}

const SurveyResponseModal = ({ survey, onClose, onSubmit }: SurveyResponseModalProps) => {
  const [responses, setResponses] = useState<ResponseItem[]>(
    survey.questions.map(q => ({
      questionId: q._id,
      questionText: q.text,
      answer: q.type === "Multiple Choice" ? [] : ""
    }))
  );

  const handleSingleChoiceChange = (questionIndex: number, value: string): void => {
    const newResponses = [...responses];
    newResponses[questionIndex].answer = value;
    setResponses(newResponses);
  };

  const handleMultipleChoiceChange = (questionIndex: number, value: string): void => {
    const newResponses = [...responses];
    const currentAnswers = newResponses[questionIndex].answer;
    
    if (Array.isArray(currentAnswers)) {
      if (currentAnswers.includes(value)) {
        newResponses[questionIndex].answer = currentAnswers.filter(item => item !== value);
      } else {
        newResponses[questionIndex].answer = [...currentAnswers, value];
      }
    } else {
      newResponses[questionIndex].answer = [value];
    }
    
    setResponses(newResponses);
  };

  const handleTextChange = (questionIndex: number, value: string): void => {
    const newResponses = [...responses];
    newResponses[questionIndex].answer = value;
    setResponses(newResponses);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    // Validate responses
    const unansweredQuestions = survey.questions
      .filter((q, index) => {
        if (q.required) {
          const response = responses[index].answer;
          return !response || (Array.isArray(response) && response.length === 0);
        }
        return false;
      })
      .map((q, i) => i + 1);
    
    if (unansweredQuestions.length > 0) {
      alert(`Please answer question${unansweredQuestions.length > 1 ? 's' : ''} ${unansweredQuestions.join(', ')}`);
      return;
    }
    
    onSubmit(responses);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">{survey.title}</h2>
          <button onClick={onClose} className="text-white hover:text-blue-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <p className="text-blue-800">{survey.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {survey.questions.map((question, qIndex) => (
            <div key={qIndex} className="border-b pb-6">
              <div className="mb-3">
                <label className="block text-lg font-medium mb-1">
                  {qIndex + 1}. {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>

              {question.type === "Text Response" && (
                <textarea
                  value={responses[qIndex].answer}
                  onChange={(e) => handleTextChange(qIndex, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={question.required}
                />
              )}

              {question.type === "Single Choice" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <label key={oIndex} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={option}
                        checked={responses[qIndex].answer === option}
                        onChange={() => handleSingleChoiceChange(qIndex, option)}
                        className="text-blue-600"
                        required={question.required}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "Multiple Choice" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <label key={oIndex} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        value={option}
                        checked={Array.isArray(responses[qIndex].answer) && responses[qIndex].answer.includes(option)}
                        onChange={() => handleMultipleChoiceChange(qIndex, option)}
                        className="text-blue-600 rounded"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "Rating Scale" && (
                <div className="flex space-x-3 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex flex-col items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={rating.toString()}
                        checked={responses[qIndex].answer === rating.toString()}
                        onChange={() => handleSingleChoiceChange(qIndex, rating.toString())}
                        className="sr-only"
                        required={question.required}
                      />
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                        responses[qIndex].answer === rating.toString()
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                        {rating}
                      </div>
                      <span className="text-xs mt-1">
                        {rating === 1 ? 'Poor' : rating === 5 ? 'Excellent' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "Yes/No" && (
                <div className="flex space-x-4 mt-2">
                  <label className={`flex items-center justify-center px-5 py-2 rounded-md cursor-pointer ${
                    responses[qIndex].answer === 'Yes' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value="Yes"
                      checked={responses[qIndex].answer === 'Yes'}
                      onChange={() => handleSingleChoiceChange(qIndex, 'Yes')}
                      className="sr-only"
                      required={question.required}
                    />
                    <span>Yes</span>
                  </label>
                  <label className={`flex items-center justify-center px-5 py-2 rounded-md cursor-pointer ${
                    responses[qIndex].answer === 'No' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value="No"
                      checked={responses[qIndex].answer === 'No'}
                      onChange={() => handleSingleChoiceChange(qIndex, 'No')}
                      className="sr-only"
                      required={question.required}
                    />
                    <span>No</span>
                  </label>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Submit Response
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyResponseModal; 