import { useState, useEffect } from "react";
import { X, Plus, Trash, Info, Calendar, HelpCircle } from "lucide-react";

// Define interfaces for our types
interface SurveyQuestion {
  text: string;
  type: string;
  options: string[];
  required: boolean;
}

interface SurveyData {
  title: string;
  description: string;
  expiresAt: string;
  targetDepartments: string[];
  questions: SurveyQuestion[];
  status?: string;
}

interface CreateSurveyModalProps {
  survey: SurveyData | null;
  onClose: () => void;
  onSave: (data: SurveyData) => void;
}

const questionTypes = [
  "Multiple Choice",
  "Single Choice",
  "Text Response",
  "Rating Scale",
  "Yes/No"
];

const departments = [
  "All Departments",
  "Human Resources",
  "IT Department",
  "Operations",
  "Finance",
  "Management"
];

const CreateSurveyModal = ({ survey = null, onClose, onSave }: CreateSurveyModalProps) => {
  const [formData, setFormData] = useState<SurveyData>({
    title: "",
    description: "",
    expiresAt: "",
    targetDepartments: [],
    questions: [{ text: "", type: "Multiple Choice", options: [""], required: true }],
    status: "Active"
  });
  
  const [activeTab, setActiveTab] = useState("basic");
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (survey) {
      setFormData({
        title: survey.title || "",
        description: survey.description || "",
        expiresAt: survey.expiresAt ? new Date(survey.expiresAt).toISOString().split('T')[0] : "",
        targetDepartments: survey.targetDepartments || [],
        questions: survey.questions && survey.questions.length ? survey.questions : 
          [{ text: "", type: "Multiple Choice", options: [""], required: true }],
        status: survey.status || "Active"
      });
    }
  }, [survey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDepartmentToggle = (dept: string) => {
    setFormData(prev => {
      if (prev.targetDepartments.includes(dept)) {
        return {
          ...prev,
          targetDepartments: prev.targetDepartments.filter(d => d !== dept)
        };
      } else {
        return {
          ...prev,
          targetDepartments: [...prev.targetDepartments, dept]
        };
      }
    });
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { text: "", type: "Multiple Choice", options: [""], required: true }]
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const addOption = (questionIndex: number) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options.push("");
      return { ...prev, questions: newQuestions };
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options[optionIndex] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
        (_, i) => i !== optionIndex
      );
      return { ...prev, questions: newQuestions };
    });
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Basic validation
    if (!formData.title.trim()) newErrors.title = "Survey title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.expiresAt) newErrors.expiresAt = "Expiration date is required";
    
    // Question validation
    const questionErrors: string[] = [];
    formData.questions.forEach((q, index) => {
      if (!q.text.trim()) {
        questionErrors.push(`Question ${index + 1} text is required`);
      }
      if ((q.type === 'Multiple Choice' || q.type === 'Single Choice') && 
          (!q.options || q.options.length < 2)) {
        questionErrors.push(`Question ${index + 1} must have at least 2 options`);
      }
    });
    
    if (questionErrors.length) {
      newErrors.questions = questionErrors.join('. ');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {survey ? 'Edit Survey' : 'Create New Survey'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 ${
              activeTab === "basic" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Info size={16} />
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 ${
              activeTab === "questions" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <HelpCircle size={16} />
            Questions
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)]">
            {activeTab === "basic" && (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Survey Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter survey title"
                      className={`border rounded-md w-full p-2.5 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the purpose of this survey"
                      className={`border rounded-md w-full p-2.5 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                      rows={4}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Expiration Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Calendar size={16} className="text-gray-500" />
                        </div>
                        <input
                          type="date"
                          name="expiresAt"
                          value={formData.expiresAt}
                          onChange={handleChange}
                          className={`border pl-10 rounded-md w-full p-2.5 ${errors.expiresAt ? 'border-red-500' : 'border-gray-300'}`}
                        />
                      </div>
                      {errors.expiresAt && <p className="mt-1 text-sm text-red-500">{errors.expiresAt}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md w-full p-2.5"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Active">Active</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Target Departments
                    </label>
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {departments.map(dept => (
                          <label key={dept} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                            <input
                              type="checkbox"
                              checked={formData.targetDepartments.includes(dept)}
                              onChange={() => handleDepartmentToggle(dept)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{dept}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500">
                      Select departments that should receive this survey. Leave empty for all departments.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "questions" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Survey Questions</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm flex items-center gap-1 hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={16} />
                    Add Question
                  </button>
                </div>

                {errors.questions && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {errors.questions}
                  </div>
                )}

                <div className="space-y-6">
                  {formData.questions.map((question, qIndex) => (
                    <div key={qIndex} className="border rounded-lg p-5 bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-800">Question {qIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50"
                        >
                          <Trash size={18} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Question Text <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                            placeholder="Enter your question"
                            className="border border-gray-300 rounded-md w-full p-2.5"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                              Question Type
                            </label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                              className="border border-gray-300 rounded-md w-full p-2.5"
                            >
                              {questionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                              Required
                            </label>
                            <div className="mt-1.5">
                              <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={question.required}
                                  onChange={(e) => updateQuestion(qIndex, 'required', e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                  Make this question required
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {(question.type === 'Multiple Choice' || question.type === 'Single Choice') && (
                          <div className="border-t pt-4 mt-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Options <span className="text-sm font-normal text-gray-500">(minimum 2)</span>
                            </label>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center space-x-2 mb-2">
                                <div className="flex-none">
                                  {question.type === 'Multiple Choice' ? (
                                    <div className="w-5 h-5 border border-gray-300 rounded inline-flex items-center justify-center">
                                      <div className="w-3 h-3 bg-blue-600 rounded-sm opacity-50"></div>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 border border-gray-300 rounded-full inline-flex items-center justify-center">
                                      <div className="w-3 h-3 bg-blue-600 rounded-full opacity-50"></div>
                                    </div>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                  className="border border-gray-300 rounded-md flex-1 p-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                  disabled={question.options.length <= 1}
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addOption(qIndex)}
                              className="mt-1 text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
                            >
                              <Plus size={14} />
                              Add Option
                            </button>
                          </div>
                        )}
                        
                        {question.type === 'Rating Scale' && (
                          <div className="border-t pt-4 mt-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Rating Preview
                            </label>
                            <div className="flex space-x-2 items-center mt-2">
                              {[1, 2, 3, 4, 5].map(num => (
                                <div key={num} className={`w-10 h-10 rounded-lg flex items-center justify-center 
                                  ${num === 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}
                                `}>
                                  {num}
                                </div>
                              ))}
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              Respondents will rate on a scale from 1 to 5
                            </p>
                          </div>
                        )}
                        
                        {question.type === 'Yes/No' && (
                          <div className="border-t pt-4 mt-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Yes/No Preview
                            </label>
                            <div className="flex space-x-3 mt-2">
                              <div className="bg-green-600 text-white px-4 py-2 rounded-md">Yes</div>
                              <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md">No</div>
                            </div>
                          </div>
                        )}
                        
                        {question.type === 'Text Response' && (
                          <div className="border-t pt-4 mt-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Text Response Preview
                            </label>
                            <div className="bg-gray-100 border border-gray-300 h-24 p-3 rounded-md text-gray-400 italic">
                              Respondent will type their answer here...
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t flex justify-between bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <div className="space-x-2">
              {activeTab === "basic" ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("questions")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Continue to Questions
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {survey ? 'Update Survey' : 'Create Survey'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSurveyModal; 