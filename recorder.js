class Recorder
{
    constructor(element, callback)
    {

        let stream = new MediaStream();
        if(element.captureStream)
        {
            stream = element.captureStream();
        }
        else if(element.mozCaptureStream)
        {
            stream = element.mozCaptureStream();
        }

        this.audioCtx = new AudioContext();
        this.audioSrc = this.audioCtx.createMediaElementSource(element);
        this.audioSrc.connect(this.audioCtx.destination);

        this.mediaRecorder = new MediaRecorder(stream);
        this.chunks = [];
        this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data);
        this.mediaRecorder.onstop = e =>
        {    
            let blob = new Blob(this.chunks, {type : "video/mp4"});
            this.chunks = [];
            let videoURL = window.URL.createObjectURL(blob);
            if(callback)
            {
                callback(videoURL);
            }
        }

    }

    start()
    {
        this.mediaRecorder.start();
    }
    stop()
    {
        this.mediaRecorder.stop();
    }

}


class RecorderWindow extends HTMLElement
{
    down = false;
    dx=0;
    dy=0;
    n=1;

    elements = [];
    recorders = [];

    constructor()
    {
        super();
    }

    get y()
	{
		return parseInt(this.style.top);
	}
	set y(value)
	{
		this.style.top = value+"px";
	}

	get x()
	{
		return parseInt(this.style.left);
	}
	set x(value)
	{
		this.style.left = value+"px";
	}
    

    update()
    {
        this.select.innerHTML = "";
        this.elements = [];
        this.recorders = [];
        document.querySelectorAll("video").forEach(el=>
        {
            this.elements.push(el);
            this.recorders.push(null);
        });
        document.querySelectorAll("canvas").forEach(el=>
        {
            this.elements.push(el);
            this.recorders.push(null);
        });

        for(let el of this.elements)
        {
            let option = document.createElement("option");
            option.innerHTML = el.id + " " + el.className;
            this.select.appendChild(option);
        }        
    }

    addLink(url)
    {
        let link = document.createElement("a");
        link.href = url;
        link.innerHTML = `video${this.n}`;
        link.download = `video${this.n}.mp4`;
        link.style.margin = "5px";
        link.style.fontSize = "12pt";
        this.links.appendChild(link)
        this.links.appendChild(document.createElement("br"));
        this.n++;
    }

    connectedCallback()
    {
        this.style.position = "absolute";
        this.style.top = "100px";
        this.style.left = "10px";
        this.style.zIndex = "10";
        let shadow = this.attachShadow({mode: "open"});
        let div = document.createElement("div");
        div.style.width = "200px";
        div.style.height = "200px";
        div.style.background = "white";
        div.style.border = "1px solid blue";

        let bar = document.createElement("div");
        bar.style.width = "200px";
        bar.style.height = "20px";
        bar.style.background = "blue";
        div.appendChild(bar);
        bar.addEventListener("mousedown", e=>
        {
            this.down = true;
            this.dx =  e.clientX - this.x;
			this.dy = e.clientY - this.y;
        });
        document.addEventListener("mousemove", e=>
        {
            if(this.down)
            {
                this.x = e.clientX - this.dx;
				this.y = e.clientY - this.dy;
            }
        });
        document.addEventListener("mouseup", e=>
        {
            this.down = false;
            
        });


        this.select = document.createElement("select");      
        this.select.style.margin = "5px";
        this.select.style.width = "100px";
        this.select.onchange = e=>
        {
            this.elements.forEach(el=>el.style.border = "none");
            let selected = this.elements[this.select.selectedIndex];
            selected.style.border = "1px solid red";   
        }
        div.appendChild(this.select);

        let recordButton = document.createElement("button");
        recordButton.innerHTML = "rec";
        recordButton.onclick = e=>
        {
            
            if(!this.recorders[this.select.selectedIndex])
            {
                let selected = this.elements[this.select.selectedIndex];
                this.recorders[this.select.selectedIndex] = new Recorder(selected, url=> this.addLink(url));
            }
            this.recorders[this.select.selectedIndex].start();
            this.select.disabled = true;
        }
        div.appendChild(recordButton);

        let stopButton = document.createElement("button");
        stopButton.innerHTML = "stop";
        stopButton.onclick = e=>
        {          
            this.recorders[this.select.selectedIndex].stop();
            this.select.disabled = false;
        }
        div.appendChild(stopButton)

        this.update();

        document.addEventListener("load", e=>
        {
            if(this.select.disabled == false)
            {
                this.update();
            }
        })

        this.links = document.createElement("div");
        this.links.style.height = "150px";
        this.links.style.overflowY = "scroll";
        div.appendChild(this.links);
        shadow.appendChild(div);
        
    }
}

customElements.define("recorder-window", RecorderWindow);



document.body.appendChild(new RecorderWindow());