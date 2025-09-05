const searchInput = document.getElementById('navbarSearchInput');
const originalListings = document.getElementById('originalListings');
const searchResultsDiv = document.getElementById('searchResults');
const searchForm = document.getElementById('navbarSearchForm');

if(searchForm) searchForm.addEventListener('submit', e => e.preventDefault());

let timeout;
if(searchInput){
  searchInput.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => performSearch(), 300);
  });
}

async function performSearch() {
  const query = searchInput.value.trim().toLowerCase();

  if(!query){
    searchResultsDiv.innerHTML = '';           // clear search results
    originalListings.style.display = 'flex';   // show original listings
    return;
  }

  // Hide original listings while searching
  originalListings.style.display = 'none';

  try {
    const res = await fetch(`/search?query=${encodeURIComponent(query)}`);
    const listings = await res.json();

    if(listings.length === 0){
      searchResultsDiv.innerHTML = "<p style='margin:2rem'>No results found</p>";
      return;
    }

    // Show search results
    searchResultsDiv.innerHTML = listings.map(l => `
      <a href="/listings/${l._id}" class="listing-link" data-category="${l.category || ''}">
        <div class="card listing-card">
          <img src="${l.image?.url || 'default.jpg'}" class="card-img-top" style="height:20rem;">
          <div class="card-body">
            <p class="card-text">
              <b>${l.title}</b><br>
              &#8377; ${l.price?.toLocaleString("en-IN") || 'N/A'}/night
              <i class="tax-info">+18% GST</i>
            </p>
          </div>
        </div>
      </a>
    `).join('');

  } catch(err){
    searchResultsDiv.innerHTML = "<p style='margin:2rem'>Error fetching results</p>";
    console.error(err);
  }
}
