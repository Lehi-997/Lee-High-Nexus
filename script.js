//step 1: Find the button and the tittle
let button=document.getElementById("changeTextBtn");
let title=document.getElementById("main-title");

//step 2: Add an action when the button is clicked
button.addEventListener("click", function(){
    title.textContent="You Clicked the Button!";
    title.style.color="red";
});
<script>
  const form = document.querySelector("form");

  form.addEventListener("submit", function(event) {
    event.preventDefault(); // stop page refresh
    const name = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    const message = document.querySelector("#message").value;

    alert(Thank you ${name}! Your message has been received.\n\nEmail: ${email}\nMessage: ${message});
  });
</script>