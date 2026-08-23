import socket
import struct
import threading

import tkinter as tk
from PIL import Image, ImageTk

import io



PORT = 9999



server = socket.socket(
    socket.AF_INET,
    socket.SOCK_STREAM
)


server.bind(
    ("0.0.0.0", PORT)
)


server.listen(1)



root = tk.Tk()

root.title(
    "Screen Stream"
)


info = tk.Label(
    root,
    text="Waiting..."
)

info.pack()



screen = tk.Label(root)

screen.pack()



def recv_exact(sock,n):

    data=b""

    while len(data)<n:

        part=sock.recv(
            n-len(data)
        )

        if not part:
            return None

        data+=part

    return data



def client():

    conn,addr=server.accept()


    # info

    text=b""

    while b"\n" not in text:

        text+=conn.recv(1024)


    info.config(
        text=text.decode()
    )



    while True:


        size=recv_exact(
            conn,
            4
        )


        if not size:
            break


        length=struct.unpack(
            "I",
            size
        )[0]


        frame=recv_exact(
            conn,
            length
        )


        if not frame:
            break



        img=Image.open(
            io.BytesIO(frame)
        )


        img.thumbnail(
            (900,600)
        )


        photo=ImageTk.PhotoImage(
            img
        )


        screen.config(
            image=photo
        )

        screen.image=photo




threading.Thread(
    target=client,
    daemon=True
).start()


root.mainloop()
