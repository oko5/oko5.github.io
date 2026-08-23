from flask import Flask, Response, request, jsonify

import time
import json


app = Flask(__name__)



latest_frame = None


info = {
    "desktop":"Waiting",
    "username":"",
    "ip":"",
    "resolution":"",
    "fps":0
}



frame_counter = 0
fps_time = time.time()



@app.route("/")
def home():

    return """
<html>

<head>

<title>Remote Desktop</title>

<style>

body{
font-family:Arial;
background:#111;
color:white;
}

img{
width:90%;
}

</style>

</head>


<body>


<h2>Remote Desktop</h2>

<div id="status">
Loading...
</div>


<img src="/stream">



<script>

setInterval(()=>{

fetch('/info')
.then(x=>x.json())
.then(x=>{

document.getElementById("status").innerHTML =
"Desktop: "+x.desktop+
"<br>Username: "+x.username+
"<br>IP: "+x.ip+
"<br>Resolution: "+x.resolution+
"<br>FPS: "+x.fps;

});

},500);


</script>


</body>

</html>
"""



@app.route("/info")
def get_info():

    return jsonify(info)



@app.route("/upload",methods=["POST"])
def upload():

    global latest_frame
    global frame_counter
    global fps_time


    buffer=b""


    while True:

        data=request.stream.read(4096)


        if not data:
            break


        buffer += data



        if b"INFO:" in buffer:

            try:

                end=buffer.index(b"\n")

                line=buffer[:end]

                buffer=buffer[end+1:]


                obj=json.loads(
                    line[5:].decode()
                )


                info.update(obj)


            except:
                pass



        while True:


            start=buffer.find(
                b"\xff\xd8"
            )


            end=buffer.find(
                b"\xff\xd9"
            )


            if start!=-1 and end!=-1:


                latest_frame = (
                    buffer[start:end+2]
                )


                buffer=buffer[end+2:]



                frame_counter += 1



                now=time.time()


                if now-fps_time>=1:

                    info["fps"]=frame_counter

                    frame_counter=0

                    fps_time=now


            else:

                break



    return "OK"



@app.route("/stream")
def stream():


    def generate():

        while True:

            if latest_frame:

                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    +
                    latest_frame
                    +
                    b"\r\n"
                )


            time.sleep(0.016)



    return Response(
        generate(),
        mimetype=
        "multipart/x-mixed-replace; boundary=frame"
    )



app.run(
    host="0.0.0.0",
    port=9999,
    threaded=True
              )
