export class ColorPalette {
    _name;
    _color_code;

    Name() {
        return this._name;
    }

    ColorCode() {
        return this._color_code;
    }

    constructor(name, color_code) {
        this._name = name;
        this._color_code = color_code;
    }
}

class History {
    _shape_array = [];
    _step = -1;

    Length() {
        // console.log("Length");
        return this._shape_array.length;
    }

    Clear() {
        this._shape_array = [];
        this._step = -1; // index
    }

    Push(data) {
        const next_step = this._step + 1;

        if (next_step < this._shape_array.length) {
            this._shape_array.length = next_step;
        }

        this._step = next_step;
        this._shape_array.push(data);
    }

    Undo() {
        if (0 <= this._step) {
            this._step--;
        }
    }

    Redo() {
        if (this._step + 1 < this._shape_array.length) {
            this._step++;
        }
    }

    Draw(context) {
        for (let i = 0; i <= this._step; i++) {
            this._shape_array[i].Draw(context);
        }
    }
}

export class CanvasController {
    _canvas;
    _context;
    _history;
    _writing_pencils;
    _brush_color;
    _current_pencil;

    constructor(canvas, brush_color) {
        this._canvas = canvas;
        this._context = this._canvas.getContext('2d');
        this._history = new History();
        this._brush_color = brush_color;

        this._writing_pencils = {};
        this._writing_pencils["line"] = new LinePencil(this._brush_color, false);
        this._writing_pencils["fill_line"] = new LinePencil(this._brush_color, true);
        this._writing_pencils["ellipse"] = new EllipsePencil(this._brush_color);
        this._writing_pencils["rectangle"] = new RectanglePencil(this._brush_color);

        this._current_pencil = this._writing_pencils["line"];

        this.Clear();
    }

    Undo() {
        this._history.Undo();
        this.Draw();
    }

    Redo() {
        this._history.Redo();
        this.Draw();
    }

    Clear() {
        this.ClearCanvas();

        // History reset
        this._history.Clear();
    }

    ChangePencil(target) {
        this._current_pencil = this._writing_pencils[target];
    }

    ChangeColor(color) {
        this._writing_pencils["line"].ChangeColor(color);
        this._writing_pencils["fill_line"].ChangeColor(color);
        this._writing_pencils["ellipse"].ChangeColor(color);
        this._writing_pencils["rectangle"].ChangeColor(color);
    }

    OnMouseDown(point) {
        this._current_pencil.MouseDown(point);
        this.Draw();
    }

    OnMouseMove(point) {
        if (this._current_pencil.IsDrawing()) {
            this._current_pencil.MouseMove(point);
            this.Draw();
        }
    }

    OnMouseup(point) {
        if (this._current_pencil.IsDrawing()) {
            var shape = this._current_pencil.MouseUp(point);

            if (shape) {
                this._history.Push(shape);
            }
        }
        this.Draw();
    }

    ClearCanvas() {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._context.fillStyle = "black";
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    Draw() {
        this.ClearCanvas();
        this._history.Draw(this._context);

        const shape = this._current_pencil.GetDrawingShape();
        if (shape) {
            shape.Draw(this._context);
        }
    }

    ChangeLineWidth(value) {
        this._writing_pencils["line"].SetLineWidth(value);
        this._writing_pencils["fill_line"].SetLineWidth(value);
    }
}

class LineShape {
    _point_list = [];
    _color;
    _is_finish = false;
    _fill = true;
    _line_width = 5;

    constructor(color, fill, line_width) {
        this._color = color;
        this._fill = fill;
        this._line_width = line_width;
    }

    Start(point) {
        this._point_list.push(point);
    }

    Update(point) {
        this._point_list.push(point);
    }

    Finish() {
        this._is_finish = true;
    }

    Draw(context) {
        context.beginPath();
        context.strokeStyle = this._color;

        if (this._point_list.length < 1) {
            return;
        }

        context.beginPath();
        context.lineWidth = this._line_width;
        context.lineCap = "round";
        context.moveTo(this._point_list[0].x, this._point_list[0].y);

        for (let i = 1; i < this._point_list.length; i++) {
            context.lineTo(this._point_list[i].x, this._point_list[i].y);
        }

        context.stroke();

        if (this._is_finish && this._fill) {
            context.fillStyle = this._color;
            context.fill();
        }

        context.closePath();
    }
}

class RectangleShape {

    _color;
    _is_finish = false;
    _start_point = null;
    _end_point = null;

    constructor(color) {
        this._color = color;
    }

    Finish() {
        this._is_finish = true;
    }

    Start(point) {
        this._start_point = point;
    }

    Update(point) {
        this._end_point = point;
    }

    Draw(context) {
        if (this._start_point && this._end_point) {
            const min_x = Math.min(this._end_point.x, this._start_point.x);
            const min_y = Math.min(this._end_point.y, this._start_point.y);

            const w = Math.abs(this._end_point.x - this._start_point.x);
            const h = Math.abs(this._end_point.y - this._start_point.y);

            context.fillStyle = this._color;
            context.fillRect(min_x, min_y, w, h);
        }
    }
}

class EllipseShape {

    _color;
    _is_finish = false;
    _start_point = null;
    _end_point = null;

    constructor(color) {
        this._color = color;
    }

    Finish() {
        this._is_finish = true;
    }

    Start(point) {
        this._start_point = point;
    }

    Update(point) {
        this._end_point = point;
    }

    Draw(context) {
        if (this._start_point && this._end_point) {
            const min_x = Math.min(this._end_point.x, this._start_point.x);
            const min_y = Math.min(this._end_point.y, this._start_point.y);

            const w = Math.abs(this._end_point.x - this._start_point.x);
            const h = Math.abs(this._end_point.y - this._start_point.y);

            const centerX = min_x + w / 2;
            const centerY = min_y + h / 2;

            context.beginPath();
            context.fillStyle = this._color;
            context.strokeStyle = this._color;
            context.ellipse(centerX, centerY, w / 2, h / 2, 0, 0, 2 * Math.PI)
            context.fill()
            context.stroke();
        }
    }
}


class LinePencil {
    _is_drawing = false;
    _color;
    _fill;
    _drawing_shape = null;
    _line_width = 5;

    constructor(color, fill) {
        this._color = color;
        this._fill = fill;
    }

    IsDrawing() {
        return this._is_drawing;
    }

    GetDrawingShape() {
        return this._drawing_shape;
    }

    ChangeColor(color) {
        this._color = color;
    }

    MouseDown(point) {
        this._is_drawing = true;
        this._drawing_shape = new LineShape(this._color, this._fill, this._line_width);
        this._drawing_shape.Start(point);
    }

    MouseMove(point) {
        if (this._is_drawing) {
            this._drawing_shape.Update(point);
        }
    }

    MouseUp(point) {
        if (this._is_drawing) {
            let shape = this._drawing_shape;
            this._drawing_shape.Update(point);
            this._drawing_shape.Finish();
            this._drawing_shape = null;
            this._is_drawing = false;
            return shape;
        }

        return null;
    }

    SetLineWidth(value) {
        this._line_width = value;
    }
}

class EllipsePencil {
    _is_drawing = false;
    _color;
    _drawing_shape = null;

    constructor(color) {
        this._color = color;
    }

    IsDrawing() {
        return this._is_drawing;
    }

    GetDrawingShape() {
        return this._drawing_shape;
    }

    ChangeColor(color) {
        this._color = color;
    }

    MouseDown(point) {
        this._drawing_shape = new EllipseShape(this._color);
        this._drawing_shape.Start(point);
        this._is_drawing = true;
    }

    MouseMove(point) {
        if (this._is_drawing) {
            this._drawing_shape.Update(point);
        }
    }

    MouseUp(point) {
        if (this._is_drawing) {
            const shape = this._drawing_shape;
            this._drawing_shape.Update(point);
            this._drawing_shape.Finish();
            this._drawing_shape = null;
            this._is_drawing = false;
            return shape;
        }

        return null;
    }
}

class RectanglePencil {
    _is_drawing = false;
    _color;
    _drawing_shape = null;

    constructor(color) {
        this._color = color;
    }

    IsDrawing() {
        return this._is_drawing;
    }

    GetDrawingShape() {
        return this._drawing_shape;
    }

    ChangeColor(color) {
        this._color = color;
    }

    MouseDown(point) {
        this._drawing_shape = new RectangleShape(this._color);
        this._drawing_shape.Start(point);
        this._is_drawing = true;
    }

    MouseMove(point) {
        if (this._is_drawing) {
            this._drawing_shape.Update(point);
        }
    }

    MouseUp(point) {
        if (this._is_drawing) {
            const shape = this._drawing_shape;
            this._drawing_shape.Update(point);
            this._drawing_shape.Finish();
            this._drawing_shape = null;
            this._is_drawing = false;
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

        if (e.offsetX || e.offsetX == 0) {
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