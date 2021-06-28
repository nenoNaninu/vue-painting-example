export class ColorPalette {
    #name;
    #color_code;

    Name() {
        return this.#name;
    }

    ColorCode() {
        return this.#color_code;
    }

    constructor(name, color_code) {
        this.#name = name;
        this.#color_code = color_code;
    }
}

class History {
    #shape_array = [];
    #step = -1;

    Length() {
        // console.log("Length");
        return this.#shape_array.length;
    }

    Clear() {
        this.#shape_array = [];
        this.#step = -1; // index
    }

    Push(data) {
        const next_step = this.#step + 1;

        if (next_step < this.#shape_array.length) {
            this.#shape_array.length = next_step;
        }

        this.#step = next_step;
        this.#shape_array.push(data);
    }

    Undo() {
        if (0 <= this.#step) {
            this.#step--;
        }
    }

    Redo() {
        if (this.#step + 1 < this.#shape_array.length) {
            this.#step++;
        }
    }

    Draw(context) {
        for (let i = 0; i <= this.#step; i++) {
            this.#shape_array[i].Draw(context);
        }
    }
}

export class CanvasController {
    #canvas;
    #context;
    #history;
    #writing_pencils;
    #brush_color;
    #current_pencil;

    constructor(canvas, brush_color) {
        this.#canvas = canvas;
        this.#context = this.#canvas.getContext('2d');
        this.#history = new History();
        this.#brush_color = brush_color;

        this.#writing_pencils = {};
        this.#writing_pencils["line"] = new LinePencil(this.#brush_color, false);
        this.#writing_pencils["fill_line"] = new LinePencil(this.#brush_color, true);
        this.#writing_pencils["ellipse"] = new EllipsePencil(this.#brush_color);
        this.#writing_pencils["rectangle"] = new RectanglePencil(this.#brush_color);

        this.#current_pencil = this.#writing_pencils["line"];

        this.Clear();
    }

    Undo() {
        this.#history.Undo();
        this.Draw();
    }

    Redo() {
        this.#history.Redo();
        this.Draw();
    }

    Clear() {
        this.ClearCanvas();

        // History reset
        this.#history.Clear();
    }

    ChangePencil(target) {
        this.#current_pencil = this.#writing_pencils[target];
    }

    ChangeColor(color) {
        this.#writing_pencils["line"].ChangeColor(color);
        this.#writing_pencils["fill_line"].ChangeColor(color);
        this.#writing_pencils["ellipse"].ChangeColor(color);
        this.#writing_pencils["rectangle"].ChangeColor(color);
    }

    OnMouseDown(point) {
        this.#current_pencil.MouseDown(point);
        this.Draw();
    }

    OnMouseMove(point) {
        if (this.#current_pencil.IsDrawing()) {
            this.#current_pencil.MouseMove(point);
            this.Draw();
        }
    }

    OnMouseup(point) {
        if (this.#current_pencil.IsDrawing()) {
            var shape = this.#current_pencil.MouseUp(point);

            if (shape) {
                this.#history.Push(shape);
            }
        }
        this.Draw();
    }

    ClearCanvas() {
        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#context.fillStyle = "black";
        this.#context.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    }

    Draw() {
        this.ClearCanvas();
        this.#history.Draw(this.#context);

        const shape = this.#current_pencil.GetDrawingShape();
        if (shape) {
            shape.Draw(this.#context);
        }
    }
}

class LineShape {
    #point_list = [];
    #color;
    #is_finish = false;
    #fill = true;

    constructor(color, fill) {
        this.#color = color;
        this.#fill = fill;
    }

    Start(point) {
        this.#point_list.push(point);
    }

    Update(point) {
        this.#point_list.push(point);
    }

    Finish() {
        this.#is_finish = true;
    }

    Draw(context) {
        context.beginPath();
        context.strokeStyle = this.#color;

        if (this.#point_list.length < 1) {
            return;
        }

        context.beginPath();
        context.lineWidth = 5;
        context.lineCap = "round";
        context.moveTo(this.#point_list[0].x, this.#point_list[0].y);

        for (let i = 1; i < this.#point_list.length; i++) {
            context.lineTo(this.#point_list[i].x, this.#point_list[i].y);
        }

        context.stroke();

        if (this.#is_finish && this.#fill) {
            context.fillStyle = this.#color;
            context.fill();
        }

        context.closePath();
    }
}

class RectangleShape {

    #color;
    #is_finish = false;
    #start_point = null;
    #end_point = null;

    constructor(color) {
        this.#color = color;
    }

    Finish() {
        this.#is_finish = true;
    }

    Start(point) {
        this.#start_point = point;
    }

    Update(point) {
        this.#end_point = point;
    }

    Draw(context) {
        if (this.#start_point && this.#end_point) {
            const min_x = Math.min(this.#end_point.x, this.#start_point.x);
            const min_y = Math.min(this.#end_point.y, this.#start_point.y);

            const w = Math.abs(this.#end_point.x - this.#start_point.x);
            const h = Math.abs(this.#end_point.y - this.#start_point.y);

            context.fillStyle = this.#color;
            context.fillRect(min_x, min_y, w, h);
        }
    }
}

class EllipseShape {

    #color;
    #is_finish = false;
    #start_point = null;
    #end_point = null;

    constructor(color) {
        this.#color = color;
    }

    Finish() {
        this.#is_finish = true;
    }

    Start(point) {
        this.#start_point = point;
    }

    Update(point) {
        this.#end_point = point;
    }

    Draw(context) {
        if (this.#start_point && this.#end_point) {
            const min_x = Math.min(this.#end_point.x, this.#start_point.x);
            const min_y = Math.min(this.#end_point.y, this.#start_point.y);

            const w = Math.abs(this.#end_point.x - this.#start_point.x);
            const h = Math.abs(this.#end_point.y - this.#start_point.y);

            const centerX = min_x + w / 2;
            const centerY = min_y + h / 2;

            context.beginPath();
            context.fillStyle = this.#color;
            context.strokeStyle = this.#color;
            context.ellipse(centerX, centerY, w / 2, h / 2, 0, 0, 2 * Math.PI)
            context.fill()
            context.stroke();
        }
    }
}


class LinePencil {
    #is_drawing = false;
    #color;
    #fill;
    #drawing_shape = null;

    constructor(color, fill) {
        this.#color = color;
        this.#fill = fill;
    }

    IsDrawing() {
        return this.#is_drawing;
    }

    GetDrawingShape() {
        return this.#drawing_shape;
    }

    ChangeColor(color) {
        this.#color = color;
    }

    MouseDown(point) {
        this.#is_drawing = true;
        this.#drawing_shape = new LineShape(this.#color, this.#fill);
        this.#drawing_shape.Start(point);
    };

    MouseMove(point) {
        if (this.#is_drawing) {
            this.#drawing_shape.Update(point);
        }
    };

    MouseUp(point) {
        if (this.#is_drawing) {
            let shape = this.#drawing_shape;
            this.#drawing_shape.Update(point);
            this.#drawing_shape.Finish();
            this.#drawing_shape = null;
            this.#is_drawing = false;
            return shape;
        }

        return null;
    };
}

class EllipsePencil {
    #is_drawing = false;
    #color;
    #drawing_shape = null;

    constructor(color) {
        this.#color = color;
    }

    IsDrawing() {
        return this.#is_drawing;
    }

    GetDrawingShape() {
        return this.#drawing_shape;
    }

    ChangeColor(color) {
        this.#color = color;
    }

    MouseDown(point) {
        this.#drawing_shape = new EllipseShape(this.#color);
        this.#drawing_shape.Start(point);
        this.#is_drawing = true;
    }

    MouseMove(point) {
        if (this.#is_drawing) {
            this.#drawing_shape.Update(point);
        }
    }

    MouseUp(point) {
        if (this.#is_drawing) {
            const shape = this.#drawing_shape;
            this.#drawing_shape.Update(point);
            this.#drawing_shape.Finish();
            this.#drawing_shape = null;
            this.#is_drawing = false;
            return shape;
        }

        return null;
    }
}

class RectanglePencil {
    #is_drawing = false;
    #color;
    #drawing_shape = null;

    constructor(color) {
        this.#color = color;
    }

    IsDrawing() {
        return this.#is_drawing;
    }

    GetDrawingShape() {
        return this.#drawing_shape;
    }

    ChangeColor(color) {
        this.#color = color;
    }

    MouseDown(point) {
        this.#drawing_shape = new RectangleShape(this.#color);
        this.#drawing_shape.Start(point);
        this.#is_drawing = true;
    }

    MouseMove(point) {
        if (this.#is_drawing) {
            this.#drawing_shape.Update(point);
        }
    }

    MouseUp(point) {
        if (this.#is_drawing) {
            const shape = this.#drawing_shape;
            this.#drawing_shape.Update(point);
            this.#drawing_shape.Finish();
            this.#drawing_shape = null;
            this.#is_drawing = false;
            return shape;
        }

        return null;
    }
}

class Point {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class Utility {

    static GetPos(canvas, e) {
        let x;
        let y;

        if (e.layerX || e.layerX == 0) { // Firefox
            x = e.layerX;
            y = e.layerY;
        } else if (e.offsetX || e.offsetX == 0) { // Opera
            x = e.offsetX;
            y = e.offsetY;
        } else if (e.type != "touchend" && (e.touches[0].clientX || e.touches[0].clientX == 0)) { // mobile
            mousePos = Utility.GetTouchPos(canvas, e);
            x = mousePos.x;
            y = mousePos.y;
        }

        return new Point(x, y);
    }

    static GetTouchPos(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
}