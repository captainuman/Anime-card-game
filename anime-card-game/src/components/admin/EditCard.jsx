import { useEffect, useMemo, useState } from "react";
import { getCard, updateCard } from "../../api/cardApi";
import { useNavigate, useParams } from "react-router-dom";
import AnimeCard from "../AnimeCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const emptyForm = {
  id: "",
  name: "",
  anime: "",
  image: "",
  position: "",
  gender: "",
  race: "",
  affiliation: "",
  famousDialogue: "",
  hp: 1,
  roles: {
    swordsman: 1,
    mage: 1,
    warrior: 1,
    tank: 1,
    healer: 1,
  },
  general: {
    speed: 1,
    strength: 1,
    intelligence: 1,
    leadership: 1,
    race: 1,
  },
  specialRole: {
    name: "",
    power: 1,
  },
  powerCategories: [],
  overallPower: 1,
};

const clampRating = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.max(1, Math.min(100, Math.round(number)));
};

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  if (
    String(image).startsWith("http://") ||
    String(image).startsWith("https://") ||
    String(image).startsWith("blob:")
  ) {
    return image;
  }

  return `${BACKEND_URL}${String(image).startsWith("/") ? image : `/${image}`}`;
};

function EditCard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const loadCard = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const response = await getCard(id);
        const card = response?.card || response;

        if (!card) {
          throw new Error("Card not found.");
        }

        setForm({
          ...emptyForm,
          ...card,
          hp: clampRating(card.hp),
          roles: {
            swordsman: clampRating(card.roles?.swordsman),
            mage: clampRating(card.roles?.mage),
            warrior: clampRating(card.roles?.warrior),
            tank: clampRating(card.roles?.tank),
            healer: clampRating(card.roles?.healer),
          },
          general: {
            speed: clampRating(card.general?.speed),
            strength: clampRating(card.general?.strength),
            intelligence: clampRating(card.general?.intelligence),
            leadership: clampRating(card.general?.leadership),
            race: clampRating(card.general?.race),
          },
          specialRole: {
            name: card.specialRole?.name || "",
            power: clampRating(card.specialRole?.power),
          },
          powerCategories: Array.isArray(card.powerCategories)
            ? card.powerCategories.map((category) => ({
                name: category?.name || "",
                power: clampRating(category?.power),
              }))
            : [],
          overallPower: clampRating(card.overallPower),
        });

        setImagePreview(card.image ? getImageUrl(card.image) : "");
        setSelectedImage(null);
      } catch (loadError) {
        console.error("Load card error:", loadError);
        setError(loadError.message || "Failed to load card.");
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [id]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const previewCard = useMemo(
    () => ({
      ...form,
      id: form.id,
      name: form.name || "Character Name",
      anime: form.anime || "Anime",
      image: imagePreview || form.image || "",
      position: form.position || "Position",
      gender: form.gender || "Gender",
      race: form.race || "Race",
      affiliation: form.affiliation || "Affiliation",
      famousDialogue: form.famousDialogue || "",
      hp: clampRating(form.hp),
      roles: form.roles,
      general: form.general,
      specialRole: form.specialRole,
      powerCategories: form.powerCategories,
      overallPower: clampRating(form.overallPower),
    }),
    [form, imagePreview],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRoleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      roles: {
        ...previous.roles,
        [name]: clampRating(value),
      },
    }));
  };

  const handleGeneralChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      general: {
        ...previous.general,
        [name]: clampRating(value),
      },
    }));
  };

  const handleSpecialRoleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      specialRole: {
        ...previous.specialRole,
        [name]: name === "power" ? clampRating(value) : value,
      },
    }));
  };

  const handlePowerCategoryChange = (index, field, value) => {
    setForm((previous) => {
      const categories = [...previous.powerCategories];

      categories[index] = {
        ...categories[index],
        [field]: field === "power" ? clampRating(value) : value,
      };

      return {
        ...previous,
        powerCategories: categories,
      };
    });
  };

  const addCategory = () => {
    setForm((previous) => ({
      ...previous,
      powerCategories: [
        ...previous.powerCategories,
        {
          name: "",
          power: 1,
        },
      ],
    }));
  };

  const removeCategory = (index) => {
    setForm((previous) => ({
      ...previous,
      powerCategories: previous.powerCategories.filter(
        (_, categoryIndex) => categoryIndex !== index,
      ),
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setError("");
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageError = () => {
    setImagePreview("");
    setError("Unable to load the card image.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.id.trim()) {
      setError("Card ID is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Character name is required.");
      return;
    }

    if (!form.anime.trim()) {
      setError("Anime is required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const cleanedCategories = (
        Array.isArray(form.powerCategories) ? form.powerCategories : []
      )
        .filter((category) => String(category?.name || "").trim() !== "")
        .map((category) => ({
          name: String(category.name).trim(),
          power: clampRating(category.power),
        }));

      const formData = new FormData();

      formData.append("id", form.id.trim());
      formData.append("name", form.name.trim());
      formData.append("anime", form.anime.trim());
      formData.append("position", form.position.trim());
      formData.append("gender", form.gender.trim());
      formData.append("race", form.race.trim());
      formData.append("affiliation", form.affiliation.trim());
      formData.append("famousDialogue", form.famousDialogue.trim());
      formData.append("hp", String(clampRating(form.hp)));

      formData.append(
        "roles",
        JSON.stringify({
          swordsman: clampRating(form.roles.swordsman),
          mage: clampRating(form.roles.mage),
          warrior: clampRating(form.roles.warrior),
          tank: clampRating(form.roles.tank),
          healer: clampRating(form.roles.healer),
        }),
      );

      formData.append(
        "general",
        JSON.stringify({
          speed: clampRating(form.general.speed),
          strength: clampRating(form.general.strength),
          intelligence: clampRating(form.general.intelligence),
          leadership: clampRating(form.general.leadership),
          race: clampRating(form.general.race),
        }),
      );

      formData.append(
        "specialRole",
        JSON.stringify({
          name: form.specialRole.name.trim(),
          power: clampRating(form.specialRole.power),
        }),
      );

      formData.append("powerCategories", JSON.stringify(cleanedCategories));

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await updateCard(id, formData);
      const updatedCard = response?.card || response;

      setMessage(`${updatedCard?.name || form.name} updated successfully.`);

      setForm((previous) => ({
        ...previous,
        ...(updatedCard || {}),
        powerCategories: Array.isArray(updatedCard?.powerCategories)
          ? updatedCard.powerCategories
          : cleanedCategories,
        overallPower: updatedCard?.overallPower ?? previous.overallPower,
      }));

      if (updatedCard?.image) {
        setImagePreview(getImageUrl(updatedCard.image));
      }

      setSelectedImage(null);

      setTimeout(() => {
        navigate("/admin/cards");
      }, 700);
    } catch (submitError) {
      console.error("Update card error:", submitError);
      setError(submitError.message || "Failed to update card.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-800 border-t-blue-500" />

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
            Loading Card
          </p>
        </div>
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#090909] p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
            Card Error
          </p>

          <p className="mt-4 text-sm text-gray-400">{error}</p>

          <button
            type="button"
            onClick={() => navigate("/admin/cards")}
            className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-black tracking-wide text-gray-300 transition hover:border-blue-500/50 hover:text-white"
          >
            BACK TO CARDS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-500">
              Admin Panel / Card Editor
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              EDIT CARD
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {form.name || "Character"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/cards")}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-[#080808] px-6 py-3.5 text-sm font-black tracking-[0.15em] text-gray-300 transition-all duration-300 hover:-translate-x-1 hover:border-blue-500/60 hover:bg-[#101010] hover:text-white hover:shadow-[0_0_25px_rgba(59,130,246,0.12)] sm:w-auto"
          >
            <span className="absolute left-0 top-0 h-full w-[3px] bg-blue-500 transition-all duration-300 group-hover:w-1" />

            <span className="text-lg text-blue-400 transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>

            <span>BACK TO CARDS</span>
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm font-semibold text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-950/30 p-4 text-sm font-semibold text-green-400">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-8 lg:grid-cols-[340px_1fr]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-3xl border border-purple-500/20 bg-[#070707] p-5 shadow-[0_0_60px_rgba(168,85,247,0.05)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">
                    Live Preview
                  </p>

                  <h2 className="mt-1 text-lg font-black">CARD DESIGN</h2>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
                  Preview
                </span>
              </div>

              <div className="flex justify-center rounded-2xl bg-black/70 p-4">
                <AnimeCard card={previewCard} />
              </div>

              <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">
                  Backend Calculated
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <span className="text-sm text-gray-500">Overall Power</span>

                  <span className="text-2xl font-black text-purple-400">
                    {form.overallPower}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-blue-500/20 bg-[#080808]">
              <SectionHeader
                title="CHARACTER INFORMATION"
                subtitle="Identity, image, and character details"
                color="blue"
              />

              <div className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput
                    label="Card ID"
                    name="id"
                    value={form.id}
                    onChange={handleChange}
                  />

                  <TextInput
                    label="Character Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />

                  <TextInput
                    label="Anime"
                    name="anime"
                    value={form.anime}
                    onChange={handleChange}
                  />

                  <TextInput
                    label="Position"
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                  />

                  <TextInput
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  />

                  <TextInput
                    label="Race"
                    name="race"
                    value={form.race}
                    onChange={handleChange}
                  />

                  <TextInput
                    label="Affiliation"
                    name="affiliation"
                    value={form.affiliation}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-white/5 bg-black/50 p-4">
                  <label className="label">Character Image</label>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-blue-500"
                  />

                  <p className="mt-2 text-[10px] text-gray-600">
                    JPG, PNG or WEBP · Max 5MB
                  </p>
                </div>

                <div className="mt-5">
                  <label className="label">Famous Dialogue</label>

                  <textarea
                    name="famousDialogue"
                    value={form.famousDialogue || ""}
                    onChange={handleChange}
                    rows={4}
                    className="input resize-none"
                  />
                </div>
              </div>
            </section>

            <section className="blue-section">
              <SectionHeader
                title="BASIC POWER"
                subtitle="Primary health and survivability"
                color="blue"
              />

              <div className="p-6">
                <div className="max-w-sm">
                  <NumberInput
                    name="hp"
                    value={form.hp}
                    onChange={handleChange}
                    label="HP"
                  />
                </div>
              </div>
            </section>

            <section className="blue-section">
              <SectionHeader
                title="ROLE POWER"
                subtitle="Power rating for every combat role"
                color="blue"
              />

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  {Object.entries(form.roles).map(([role, value]) => (
                    <NumberInput
                      key={role}
                      name={role}
                      value={value}
                      onChange={handleRoleChange}
                      label={formatLabel(role)}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="blue-section">
              <SectionHeader
                title="GENERAL POWER"
                subtitle="Core statistics used by special positions"
                color="blue"
              />

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  {Object.entries(form.general).map(([stat, value]) => (
                    <NumberInput
                      key={stat}
                      name={stat}
                      value={value}
                      onChange={handleGeneralChange}
                      label={formatLabel(stat)}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="blue-section">
              <SectionHeader
                title="SPECIAL ROLE"
                subtitle="Special ability or support position power"
                color="blue"
              />

              <div className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="label">Special Role</label>

                    <input
                      type="text"
                      name="name"
                      value={form.specialRole.name}
                      onChange={handleSpecialRoleChange}
                      className="input"
                    />
                  </div>

                  <NumberInput
                    name="power"
                    value={form.specialRole.power}
                    onChange={handleSpecialRoleChange}
                    label="Power"
                  />
                </div>
              </div>
            </section>

            <section className="blue-section">
              <SectionHeader
                title="POWER CATEGORIES"
                subtitle="Custom categories used for power calculation"
                color="blue"
              />

              <div className="p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">
                      Custom Power Stats
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Add or remove custom power categories.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addCategory}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black transition hover:bg-blue-500"
                  >
                    ADD CATEGORY
                  </button>
                </div>

                <div className="space-y-4">
                  {form.powerCategories.map((category, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-blue-500/20 bg-black/50 p-4"
                    >
                      <div className="mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">
                          Category #{index + 1}
                        </span>
                      </div>

                      <div className="grid items-end gap-4 md:grid-cols-[1fr_180px_auto]">
                        <TextInput
                          label="Category Name"
                          value={category.name}
                          onChange={(event) =>
                            handlePowerCategoryChange(
                              index,
                              "name",
                              event.target.value,
                            )
                          }
                        />

                        <NumberInput
                          label="Power"
                          value={category.power}
                          onChange={(event) =>
                            handlePowerCategoryChange(
                              index,
                              "power",
                              event.target.value,
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() => removeCategory(index)}
                          className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm font-black text-red-400 transition hover:border-red-500/50 hover:bg-red-900/50"
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  ))}

                  {form.powerCategories.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 px-6 py-8 text-center">
                      <p className="text-sm text-gray-600">
                        No custom power categories.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-purple-500/20 bg-purple-950/10">
              <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
                    Automatic Calculation
                  </p>

                  <h2 className="mt-1 text-2xl font-black">OVERALL POWER</h2>

                  <p className="mt-2 max-w-xl text-xs text-gray-500">
                    Calculated automatically by the backend from the card
                    ratings.
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-500/30 bg-black/60 px-8 py-4 text-center">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-gray-600">
                    Rating
                  </p>

                  <p className="text-4xl font-black text-purple-400">
                    {form.overallPower}
                  </p>

                  <p className="text-[10px] text-gray-600">1 – 100</p>
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 py-4 text-lg font-black tracking-wide shadow-xl shadow-blue-950/30 transition hover:from-blue-600 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "SAVING CHANGES..." : "SAVE CHANGES"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, color }) {
  const isRed = color === "red";

  return (
    <div
      className={`border-b px-6 py-5 ${
        isRed
          ? "border-red-500/20 bg-red-950/20"
          : "border-blue-500/20 bg-blue-950/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-8 w-1 rounded-full ${
            isRed ? "bg-red-500" : "bg-blue-500"
          }`}
        />

        <div>
          <h2
            className={`text-lg font-black tracking-wide md:text-xl ${
              isRed ? "text-red-400" : "text-blue-400"
            }`}
          >
            {title}
          </h2>

          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function TextInput({ name, value, onChange, label }) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        className="input"
      />
    </div>
  );
}

function NumberInput({ name, value, onChange, label }) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        type="number"
        name={name}
        value={value ?? 1}
        onChange={onChange}
        min="1"
        max="100"
        step="1"
        className="input"
      />

      <p className="mt-1 text-[10px] text-gray-600">Rating: 1 – 100</p>
    </div>
  );
}

function formatLabel(value) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default EditCard;
