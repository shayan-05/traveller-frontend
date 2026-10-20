
import { useEffect, useId, useRef, useState } from "react";

export default function LocationInput({
  label,
  placeholder,
  value="",
  onLocationSelect,
}) {
  const [query, setQuery] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");

  const wrapperRef = useRef(null);
  const inputId = useId();

  if (value !== previousValue) {
    setPreviousValue(value);
    setQuery(value);
  }
  
  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      if (query.trim().length < 3) {
        setSuggestions([]);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          q: query.trim(),
          limit: "10",
          lat: "27.18",
          lon: "78.05",
          lang:"en"
        });

        const response = await fetch(
          `https://photon.komoot.io/api/?${params}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Address search failed");
        }

        const data = await response.json();
        const features = data.features || [];

const rankedFeatures = features
  .map((feature) => {
    const props = feature.properties || {};

    const locationText = [
      props.city,
      props.county,
      props.state,
      props.country,
      props.locality,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const queryText = query.trim().toLowerCase();

    const isAligarhRegion =
      locationText.includes("aligarh") ||
      locationText.includes("uttar pradesh");

    const name = [
      props.name,
      props.street,
      props.locality,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = name.includes(queryText);

    return {
      feature,
      score:
        (isAligarhRegion ? 100 : 0) +
        (matchesQuery ? 20 : 0),
    };
  })
  .sort((a, b) => b.score - a.score)
  .map((item) => item.feature);

setSuggestions(rankedFeatures);
        setShowSuggestions(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Could not load suggestions. Please try again.");
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function selectLocation(feature) {
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;

    const address = [
      props.name,
      props.street,
      props.locality,
      props.city,
      props.state,
    ]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", ");

    setQuery(address);
    setSuggestions([]);
    setShowSuggestions(false);
    setError("");

    onLocationSelect?.({
      lat,
      lng,
      address,
    });
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        id={inputId}
        type="text"
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setShowSuggestions(true);
          onLocationSelect?.(null);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      {loading && (
        <p className="mt-1 text-xs text-slate-500">
          Searching addresses...
        </p>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {suggestions.map((feature, index) => {
            const props = feature.properties;

            const title =
              props.name ||
              props.street ||
              "Unknown location";

            const subtitle = [
              props.city || props.locality,
              props.state,
              props.country,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <li key={`${feature.geometry.coordinates.join(",")}-${index}`}>
                <button
                  type="button"
                  onClick={() => selectLocation(feature)}
                  className="w-full px-4 py-3 text-left transition hover:bg-blue-50"
                >
                  <span className="block text-sm font-medium text-slate-800">
                    {title}
                  </span>

                  {subtitle && (
                    <span className="mt-1 block text-xs text-slate-500">
                      {subtitle}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showSuggestions &&
        !loading &&
        query.trim().length >= 3 &&
        suggestions.length === 0 &&
        !error && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-lg">
            No locations found. Try another search.
          </div>
        )}
    </div>
  );
}
