const board = document.querySelector('.board');
const blockHeight = 100;
const blockwidth = 100;


const cols = Math.floor(board.clientWidth / blockwidth);
const rows = Math.floor(board.clientHeight / blockHeight);

const blocks = [];



for( let row = 0; row < rows; row++){
    for(let col = 0; col < cols; col++){
        const block = document.createElement('div');
        block.classList.add("block");
        board.appendChild(block);
        block.innerText = `${row}-${col}`
        blocks[`${row}-${col}`] = block;

    }
}