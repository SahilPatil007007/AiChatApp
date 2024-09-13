import './newPrompt.css'
import { useEffect, useRef, useState} from 'react';
import Upload from '../upload/Upload';
import  {IKImage}  from 'imagekitio-react';
import model from '../../lib/gemini';
import Markdown from "react-markdown"
import { useMutation, useQueryClient } from '@tanstack/react-query';

const NewPrompt = ({data}) => {

    const[question, setQuestion] = useState("");
    const[answer, setAnswer] = useState("");

    const [img, setImg] = useState({
        isLoading: false,
        error:"",
        dbData: {},
        aiData:{}
    })

    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: 'Hello!' }] }, // Initial user message
            ...(data?.history.map(({ role, parts }) => ({
                role,
                parts: [{ text: parts[0].text }],
            })) || []),
        ],
        generationConfig: {
            // maxOutputTokens: 100,
        },
    });
    

    const endRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() =>{
        endRef.current.scrollIntoView({behavior: "smooth"});
    }, [data,question, answer, img.dbData]);


    // Initialize the query client for managing and invalidating queries
    const queryClient = useQueryClient();

    const mutation = useMutation({
    // mutationFn defines the function to be executed when the mutation is triggered
    mutationFn: () => {
        // Make a POST request to the API to create a new chat
        return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include", // Include credentials in the request
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: question.length ? question : undefined, answer, img: img.dbData?.filePath || undefined}), // Send the chat text as the request body
        }).then((res) => res.json()); // Parse and return the response as JSON
    },
    // onSuccess is called if the mutation is successful
    onSuccess: () => {
        // Invalidate the 'userChats' query to refetch updated chat data
        queryClient.invalidateQueries({ queryKey: ['chat', data._id] }).then(() =>{
            formRef.current.reset();
            setQuestion("")
            setAnswer("")
            setImg({
                isLoading: false,
                error:"",
                dbData: {},
                aiData:{}
            })
        });
    },
    onError: (err) => {
        console.log(err);
    }
    });


    const add = async(text, isInitial) => {
        if(!isInitial) setQuestion(text);

        try{
            const result = await chat.sendMessageStream(
                Object.entries(img.aiData).length ? [img.aiData, text]: [text]
            );
            let accumulatedText = "";
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                accumulatedText = accumulatedText + chunkText;
                setAnswer(accumulatedText);
            }

            mutation.mutate();
        }catch(err){
            console.log(err);
        }

    };

    const handleSubmit = async(e) =>{
        e.preventDefault();

        const text = e.target.text.value;

        if(!text) return;

        add(text, false); 
    }

    const hasRun = useRef(false);
    useEffect(()=>{
        if(!hasRun.current){
            if(data?.history?.length === 1){
                add(data.history[0].parts[0].text, true);
            }
        }
        hasRun.current = true;
    }, []);

    return (
    <>
        {img.isLoading && <div className=''>Loading...</div>}
        {img.dbData?.filePath &&
            <IKImage
                urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                path={img.dbData?.filePath}
                width="300"
                transformation={[{width:1000}]}
            />
        }
        {question &&<div className='message user'>{question}</div>}
        {answer && <div className='message'><Markdown>{answer}</Markdown></div>}
        <div className="endChat" ref={endRef}></div>
            <form className='newForm' onSubmit={handleSubmit} ref={formRef}>
                <Upload setImg={setImg}/>
                <input id="file" type="file" multiple={false} hidden/>
                <input type="text" name='text' placeholder='Ask anything...' />
                <button>
                    <img src="/arrow.png" alt="" />
                </button>
            </form>
    </>
  )
}

export default NewPrompt