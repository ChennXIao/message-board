const messageForm = document.getElementById('messageForm');
const messageList = document.getElementById('messageList');
const fileInputElement = document.getElementById('image'); 
let message;

renderingPage();

messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(messageForm);
    message = formData.get('message');
    const image = formData.get('image');
    await uploadImage(image);    
    messageForm.reset();
    messageList.innerHTML = "";
    await renderingPage();
});

async function uploadImage(image) {
  const accessImageData = new FormData();
  accessImageData.append('image', fileInputElement.files[0]);
  accessImageData.append('text', message);
  
  try {
      let response = await fetch('/upload', {
        method: 'POST',
        body: accessImageData,
      });
  
      if (response.ok) {
        let data = await response.json();
        return data;
      } else {
        console.error('Error uploading image to S3');
        return null;
      }
  } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }



async function renderingPage(){
  let dataFetched = await fetchData();
  for(let i = dataFetched.length-1 ; i >= 0;i--){
    let fetchText = dataFetched[i].text
    let imageUrl = dataFetched[i].image
  
    const uploadsIndex = imageUrl.indexOf('/uploads');
    const relativePath = imageUrl.substring(uploadsIndex);
    const cloudfrontUrl = "https://d5p76psmku2sj.cloudfront.net"+relativePath

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<p>${fetchText}</p>`;
    const hrElement = document.createElement('hr');

    if (cloudfrontUrl) {
      const imageElement = document.createElement('img');
      imageElement.src = cloudfrontUrl;
      messageElement.appendChild(imageElement);
    }
    messageList.appendChild(messageElement);
    messageList.appendChild(hrElement);
}

}

async function fetchData() {
  try {
    let response = await fetch('/data', {
      method: 'GET',
    });

    if (response.ok) {
      let data = await response.json();
      return data.results;
    } else {
      console.error('Error uploading image to S3');
      return null;
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}