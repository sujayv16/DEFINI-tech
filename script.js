const dictionaryUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const thesaurusUrl = "https://api.datamuse.com/words"; // Thesaurus API endpoint
const result = document.getElementById("result");
const sound = document.getElementById("sound");
const btn = document.getElementById("search-btn");

document.addEventListener('DOMContentLoaded', function () {
    btn.addEventListener('click', function () {
        searchWord();
    });
});

async function searchWord() {
    let inpWord = document.getElementById("inp-word").value;
    try {
        const response = await fetch(`${dictionaryUrl}${inpWord}`);
        const data = await response.json();

        if (!response.ok || !data.length) {
            showSuggestions(inpWord);
            return;
        }

        const wordData = data[0];
        displayWordDetails(wordData, inpWord);

        // Fetch synonyms only
        await fetchSynonyms(inpWord);
    } catch (error) {
        console.error("Error fetching data:", error);
        result.innerHTML = `<h3 class="error">Error: ${error.message}</h3>`;
    }
}

function displayWordDetails(wordData, inpWord) {
    result.innerHTML = `
        <div class="word">
            <h3>${inpWord}</h3>
            <button class="sound-btn" data-audio="${wordData.phonetics[0]?.audio || ''}">
                <i class="fas fa-volume-up"></i>
            </button>
        </div>
        <div class="details">
            <p>${wordData.meanings[0].partOfSpeech}</p>
            <p>/${wordData.phonetic || ''}/</p>
        </div>
        <p class="word-meaning">
            ${wordData.meanings[0].definitions[0].definition}
        </p>
        <p class="word-example">
            ${wordData.meanings[0].definitions[0].example || ""}
        </p>`;

    const soundBtn = document.querySelector(".sound-btn");
    soundBtn.addEventListener("click", function () {
        const audioUrl = this.getAttribute("data-audio");
        playSound(audioUrl);
    });
}

function playSound(audioUrl) {
    if (audioUrl) {
        sound.src = audioUrl;
        sound.load();
        sound.play().catch((error) => {
            console.error("Error playing audio:", error);
        });
    } else {
        console.error("No audio URL provided.");
    }
}

async function showSuggestions(word) {
    const similarWords = await fetchSimilarWords(word);
    if (similarWords.length) {
        result.innerHTML = `<h3>Did you mean:</h3>`;
        similarWords.forEach(similarWord => {
            const suggestion = document.createElement('p');
            suggestion.innerText = similarWord;
            suggestion.classList.add('suggestion');
            suggestion.addEventListener('click', () => {
                document.getElementById("inp-word").value = similarWord;
                searchWord();
            });
            result.appendChild(suggestion);
        });
    } else {
        result.innerHTML = `<h3 class="error">Couldn't Find The Word</h3>`;
    }
}

async function fetchSimilarWords(word) {
    const response = await fetch(`${thesaurusUrl}?sl=${word}`);
    const data = await response.json();
    return data.slice(0, 5).map(entry => entry.word);
}

async function fetchSynonyms(word) {
    const synonymsResponse = await fetch(`${thesaurusUrl}?rel_syn=${word}`);
    const synonymsData = await synonymsResponse.json();
    const synonyms = synonymsData.map(entry => entry.word);
    displaySynonyms(synonyms);
}

function displaySynonyms(synonyms) {
    let synonymsHTML = `<h4>Synonyms:</h4>`;
    if (synonyms.length > 0) {
        synonymsHTML += `<p class="synonyms-list">${synonyms.join(', ')}</p>`;
    } else {
        synonymsHTML += `<p>No synonyms found.</p>`;
    }

    // Remove any existing synonyms container
    const synonymsContainer = document.querySelector('.synonyms-antonyms');
    if (synonymsContainer) {
        synonymsContainer.remove();
    }

    // Append synonyms after word details
    const newSynonymsContainer = document.createElement('div');
    newSynonymsContainer.classList.add('synonyms-antonyms');
    newSynonymsContainer.innerHTML = synonymsHTML;
    result.appendChild(newSynonymsContainer);
}
