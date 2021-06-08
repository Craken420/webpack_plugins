import './style.scss';
import passwordIcon from './img/lock-solid.svg';
import copyIcon from './img/copy-solid.svg';
    
document.getElementById('copy_icon').src = copyIcon;
document.getElementById('password_icon').src = passwordIcon;

const add = (x, y) => x+y;

console.log('add: ', add(1, 5))
