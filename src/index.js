import {fromEvent} from 'rxjs'
import {map, pairwise, switchMap, takeUntil, withLatestFrom, startWith} from 'rxjs/operators'
import './styles.css'

const canvas = document.querySelector('canvas');
const range = document.getElementById('range');
const color = document.getElementById('color');
const clearButton = document.getElementById('clearButton');
const saveButton = document.getElementById('saveButton');

const context = canvas.getContext('2d');
const rect = canvas.getBoundingClientRect();
const scale = window.devicePixelRatio;

canvas.width = rect.width * scale;
canvas.height = rect.height * scale;
context.scale(scale, scale);

const mouseMove$ = fromEvent(canvas, 'mousemove');
const mouseDown$ = fromEvent(canvas, 'mousedown');
const mouseUp$ = fromEvent(canvas, 'mouseup');
const mouseOut$ = fromEvent(canvas, 'mouseout');
const clearButton$ = fromEvent(clearButton, 'click');
const saveButton$ = fromEvent(saveButton, 'click');

const lineWidth$ = createInputStream(range);
const strokeStyle$ = createInputStream(color);

function createInputStream(element) {
    return fromEvent(element, 'input')
        .pipe(
            map(e => e.target.value),
            startWith(element.value)
        )
}

const stream$ = mouseDown$
    .pipe(
        withLatestFrom(lineWidth$, strokeStyle$, (_, lineWidth, strokeStyle) => {
            return {lineWidth, strokeStyle}
        }),
        switchMap(options => {
            return mouseMove$
                .pipe(
                    map(e => ({
                        x: e.offsetX,
                        y: e.offsetY,
                        options
                    })),
                    pairwise(),
                    takeUntil(mouseUp$),
                    takeUntil(mouseOut$)
                )
        })
    );


stream$.subscribe(([from, to]) => {
    const {lineWidth, strokeStyle} = from.options;

    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
});

clearButton$.subscribe(() => {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

saveButton$.subscribe(() => {
    const dataURL = canvas.toDataURL("image/png", "image/octet-stream");
    saveButton.href = dataURL;
});
