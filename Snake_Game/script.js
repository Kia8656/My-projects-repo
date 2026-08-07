const board = document.querySelector('.board');
const blockHeight = 100;
const blockwidth = 100;


const cols = Math.floor(board.clientWidth / blockwidth);
const rows = Math.floor(board.clientHeight / blockHeight);
let intervalId = null;
let food = {x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols)};

const blocks = [];
const snake = [{x: 6, y: 5}, {x: 6, y: 6}];

let direction = 'down';



for( let row = 0; row < rows; row++){
    for(let col = 0; col < cols; col++){
        const block = document.createElement('div');
        block.classList.add("block");
        board.appendChild(block);
        block.innerText = `${row}-${col}`
        blocks[`${row}-${col}`] = block;

    }
}


function render(){
    let head = null;

    blocks[`${food.x}-${food.y}`].classList.add("food");

    if(direction === "right"){
        head = {x: snake[0].x, y: snake[0].y + 1}

    }
    if(direction === "left"){
        head = {x: snake[0].x, y: snake[0].y - 1}

    }
    if(direction === "up"){
        head = {x: snake[0].x - 1, y: snake[0].y}

    }
    if(direction === "down"){
        head = {x: snake[0].x + 1, y: snake[0].y}

    }

    if(head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols){
        alert("Game Over");
        clearInterval(intervalId);

    }

    if(head.x == food.x && head.y == food.y){
        blocks[`${food.x}-${food.y}`].classList.remove("food");
        food = {x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols)};
        blocks[`${food.x}-${food.y}`].classList.add("food");

    }


    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.remove('fill');


    });

    // snake.unshift(head);
    // snake.pop();


    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.add('fill');
        

    });
}

intervalId = setInterval(() => {


    render();
}, 300);



addEventListener("keydown", (event) => {
    if(event.key == "ArrowUp"){
        direction = "up"
    }
    if(event.key == "ArrowDown"){
        direction = "down"
    }
    if(event.key == "ArrowRight"){
        direction = "right"
    }
    if(event.key == "ArrowLeft"){
        direction = "left"
    }

});