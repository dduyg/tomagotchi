import random
def magic_8_ball():
    responses = [
        "Yes, definitely!", "Ask again later.", "No, I don't think so.",
        "Without a doubt.", "Maybe... Try again.", "I wouldn't count on it.",
        "Yes, but be cautious.", "My sources say yes.", "Signs point to no.",
        "Reply hazy, try again.", "Better not tell you now."
    ]
    
    question = input("Ask a yes-or-no question: ")
    print("Shaking the Magic 8-Ball...\n")
    print("The Magic 8-Ball says:", random.choice(responses))

magic_8_ball()
