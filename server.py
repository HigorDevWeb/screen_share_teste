from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder="static", template_folder="templates")
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/")
def index():
    return render_template("share.html")  # Página de compartilhamento

@app.route("/view")
def view():
    return render_template("view.html")  # Página de visualização

@socketio.on("signal")
def handle_signal(data):
    # Retransmite a sinalização WebRTC entre clientes
    emit("signal", data, broadcast=True, include_self=False)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True )
