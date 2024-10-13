from flask import Flask, request, jsonify
from transformers import pipeline

# Create a Flask app
app = Flask(__name__)

# Define the Question Answering pipeline with a specific model
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

# Define the Text Summarization pipeline with a specific model
summarization_pipeline = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

@app.route('/')
def home():
    return "AI Study Assistant Backend Running!"

# Endpoint to handle question-answering
@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    question = data.get('question')
    context = data.get('context')
    
    # Ensure both question and context are provided
    if not question or not context:
        return jsonify({'error': 'Please provide both a question and context.'}), 400

    # Get the answer using the question-answering model
    answer = qa_pipeline(question=question, context=context)
    return jsonify({'answer': answer['answer']})

# Endpoint to handle text summarization
@app.route('/summarize', methods=['POST'])
def summarize_text():
    data = request.get_json()
    text = data.get('text')
    
    # Ensure the text is provided
    if not text:
        return jsonify({'error': 'Please provide text to summarize.'}), 400

    # Summarize the text using the summarization model
    summary = summarization_pipeline(text, max_length=130, min_length=30, do_sample=False)
    return jsonify({'summary': summary[0]['summary_text']})

if __name__ == '__main__':
    app.run(port=5001)  # Change to 5001 or any other number
