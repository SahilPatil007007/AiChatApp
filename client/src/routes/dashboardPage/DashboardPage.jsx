// Import necessary hooks and CSS for the dashboard
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Hooks from react-query for handling mutations and query management
import './dashboard.css' // Importing the CSS file for styling the dashboard
import { useNavigate } from 'react-router-dom'; // Hook from react-router-dom to programmatically navigate

// Functional component representing the Dashboard page
const DashboardPage = () => {

  // Initialize the query client for managing and invalidating queries
  const queryClient = useQueryClient();
  
  // Initialize the navigation hook to navigate to different routes
  const navigate = useNavigate(); 

  // Define a mutation for posting chat data to the server
  const mutation = useMutation({
    // mutationFn defines the function to be executed when the mutation is triggered
    mutationFn: (text) => {
      // Make a POST request to the API to create a new chat
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
        method: "POST",
        credentials: "include", // Include credentials in the request
        headers: {
          "Content-Type": "application/json" // Specify the content type as JSON
        },
        body: JSON.stringify({ text }), // Send the chat text as the request body
      }).then((res) => res.json()); // Parse and return the response as JSON
    },
    // onSuccess is called if the mutation is successful
    onSuccess: (id) => {
      // Invalidate the 'userChats' query to refetch updated chat data
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      // Navigate to the chat page for the newly created chat using the returned id
      navigate(`/dashboard/chats/${id}`);
    },
  });

  // Handler function for form submission
  const handleSubmit = async(e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    const text = e.target.text.value; // Get the value of the text input

    if (!text) return; // If the text input is empty, do nothing

    // Trigger the mutation to create a new chat
    mutation.mutate(text);
  };

  // Render the dashboard page
  return (
    <div className='dashboardPage'>

      <div className='texts'>
        <div className="logo">
          {/* Display the logo */}
          <img src="/logo.png" alt="" />
          <h1>LAMA AI</h1>
        </div>

        <div className="options">
          {/* Options for different actions on the dashboard */}
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Create a New Chat</span>
          </div>
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Analyze Image</span>
          </div>
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Help me with my Code</span>
          </div>
        </div>
      </div>

      <div className="formContainer">
        {/* Form for submitting a new chat */}
        <form onSubmit={handleSubmit}>
          <input type="text" name="text" placeholder='Ask me anything...' />
          <button>
            <img src="/arrow.png" alt="" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default DashboardPage; // Export the DashboardPage component as the default export
