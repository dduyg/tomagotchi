import random

def magic_8_ball():
    responses = [
        "Yes, definitely!", "Ask again later.", "No, I don't think so.", "Absolutely!", "Maybe... Try again.", "I wouldn't count on it.",
        "Yes, but be cautious.", "Don't bet on it.", "My sources say yes.", "Not in a million years."
    ]
    
    question = input("Ask a yes/no question: ")
    print("Thinking...")
    print("The Magic 8-Ball says:", random.choice(responses))

magic_8_ball()
