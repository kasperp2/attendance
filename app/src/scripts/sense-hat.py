import sys
from sense_hat import SenseHat
import time

sense = SenseHat()
# sense.set_rotation(90)
sense.gamma_reset()
# sense.low_light = True



match sys.argv[1]:
    case "show_message":
        sense.show_message(sys.argv[2], text_colour=[0, 150, 0], scroll_speed=0.05)

    case "set_pixel":
        input = sys.argv[2].split("-")
        input = list(map(int, input))

        sense.set_pixel(input[0],input[1],input[2],input[3],input[4])
        print(sense.get_pixels())

    case "get_pixels":
        print(sense.get_pixels())

    case "clear":
        sense.clear()
        print(sense.get_pixels())
    
    case "user_accepted":
        sense.clear()
        O = [80,255,80] 
        data = [
            O, O, O, O, O, O, O, O,
            O, O, O, O, O, O, O, O,
            O, O, O, O, O, O, O, O,
            O, O, O, O, O, O, O, O,
            O, O, O, O, O, O, O, O,
            O, O, O, O, O, O, O, O,
            O, O, O, O, O, O, O, O,
            O, O, O, O, O, O, O, O
        ]
        sense.set_pixels(data)
        time.sleep(0.5)
        sense.clear()


        