import { useEffect, useState } from "react";
import { createCard } from "../../api/cardApi";

const emptyForm = {
  id: "",
  name: "",
  anime: "",
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
  powerCategories: [
    {
      name: "",
      power: 1,
    },
  ],
};

function clampRating(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.max(1, Math.min(100, Math.round(number)));
}

function AddCard() {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
        [name]: value,
      },
    }));
  };

  const handleGeneralChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      general: {
        ...previous.general,
        [name]: value,
      },
    }));
  };

  const handleSpecialRoleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      specialRole: {
        ...previous.specialRole,
        [name]: value,
      },
    }));
  };

  const handlePowerCategoryChange = (index, field, value) => {
    setForm((previous) => {
      const categories = [...previous.powerCategories];

      categories[index] = {
        ...categories[index],
        [field]: value,
      };

      return {
        ...previous,
        powerCategories: categories,
      };
    });
  };

  const addPowerCategory = () => {
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

  const removePowerCategory = (index) => {
    setForm((previous) => {
      const categories = previous.powerCategories.filter(
        (_, categoryIndex) => categoryIndex !== index,
      );

      return {
        ...previous,
        powerCategories:
          categories.length > 0
            ? categories
            : [
                {
                  name: "",
                  power: 1,
                },
              ],
      };
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (!imageFile) {
        setMessage("Please select a character image.");
        return;
      }

      const cleanedPowerCategories = form.powerCategories
        .filter((category) => category.name.trim() !== "")
        .map((category) => ({
          name: category.name.trim(),
          power: clampRating(category.power),
        }));

      const cardData = {
        id: form.id.trim(),
        name: form.name.trim(),
        anime: form.anime.trim(),
        position: form.position.trim(),
        gender: form.gender.trim(),
        race: form.race.trim(),
        affiliation: form.affiliation.trim(),
        famousDialogue: form.famousDialogue.trim(),
        hp: clampRating(form.hp),
        roles: {
          swordsman: clampRating(form.roles.swordsman),
          mage: clampRating(form.roles.mage),
          warrior: clampRating(form.roles.warrior),
          tank: clampRating(form.roles.tank),
          healer: clampRating(form.roles.healer),
        },
        general: {
          speed: clampRating(form.general.speed),
          strength: clampRating(form.general.strength),
          intelligence: clampRating(form.general.intelligence),
          leadership: clampRating(form.general.leadership),
          race: clampRating(form.general.race),
        },
        specialRole: {
          name: form.specialRole.name.trim(),
          power: clampRating(form.specialRole.power),
        },
        powerCategories: cleanedPowerCategories,
      };

      if (
        !cardData.id ||
        !cardData.name ||
        !cardData.anime ||
        !cardData.position ||
        !cardData.gender ||
        !cardData.race ||
        !cardData.affiliation
      ) {
        setMessage("Please complete all required character information.");
        return;
      }

      const formData = new FormData();

      formData.append("id", cardData.id);
      formData.append("name", cardData.name);
      formData.append("anime", cardData.anime);
      formData.append("position", cardData.position);
      formData.append("gender", cardData.gender);
      formData.append("race", cardData.race);
      formData.append("affiliation", cardData.affiliation);
      formData.append("famousDialogue", cardData.famousDialogue);
      formData.append("hp", String(cardData.hp));
      formData.append("roles", JSON.stringify(cardData.roles));
      formData.append("general", JSON.stringify(cardData.general));
      formData.append("specialRole", JSON.stringify(cardData.specialRole));
      formData.append(
        "powerCategories",
        JSON.stringify(cardData.powerCategories),
      );
      formData.append("image", imageFile);

      const response = await createCard(formData);
      const createdCard = response?.card;

      setMessage(
        `Character added successfully! Overall Power: ${
          createdCard?.overallPower ?? "Calculated"
        }`,
      );

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setForm({
        ...emptyForm,
        roles: { ...emptyForm.roles },
        general: { ...emptyForm.general },
        specialRole: { ...emptyForm.specialRole },
        powerCategories: emptyForm.powerCategories.map((category) => ({
          ...category,
        })),
      });

      setImageFile(null);
      setImagePreview("");
      event.target.reset();
    } catch (error) {
      console.error("Create card error:", error);

      setMessage(error.message || "Failed to create character");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-500">
              Character Database
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              ADD ANIME CHARACTER
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Create a new character battle card
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-[#090909] px-6 py-3.5 text-sm font-black tracking-[0.15em] text-gray-300 transition-all duration-300 hover:-translate-x-1 hover:border-blue-500/60 hover:bg-[#101010] hover:text-white hover:shadow-[0_0_25px_rgba(59,130,246,0.12)] sm:w-auto"
          >
            <span className="absolute left-0 top-0 h-full w-[3px] bg-blue-500 transition-all duration-300 group-hover:w-1" />

            <span className="text-base text-blue-400 transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>

            <span>BACK</span>
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 font-semibold ${
              message.startsWith("Character added successfully")
                ? "border-green-500/30 bg-green-950/40 text-green-400"
                : "border-red-500/30 bg-red-950/40 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          <section className="overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-gray-950 to-gray-950 shadow-lg shadow-red-950/20">
            <SectionHeader
              title="CHARACTER INFORMATION"
              subtitle="Basic identity and character details"
              color="red"
            />

            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Input
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  placeholder="Example: OP-PUDDING-001"
                  label="Card ID"
                  required
                />

                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Charlotte Pudding"
                  label="Character Name"
                  required
                />

                <Input
                  name="anime"
                  value={form.anime}
                  onChange={handleChange}
                  placeholder="Example: One Piece"
                  label="Anime"
                  required
                />

                <Input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  placeholder="Example: Warrior"
                  label="Position"
                  required
                />

                <Input
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  placeholder="Example: Female"
                  label="Gender"
                  required
                />

                <Input
                  name="race"
                  value={form.race}
                  onChange={handleChange}
                  placeholder="Example: Three-Eye Tribe"
                  label="Race"
                  required
                />

                <Input
                  name="affiliation"
                  value={form.affiliation}
                  onChange={handleChange}
                  placeholder="Example: Big Mom Pirates"
                  label="Affiliation"
                  required
                />

                <div>
                  <label className="label">
                    Character Image
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-3 text-gray-400 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-red-600 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-red-500 focus:border-red-500 focus:outline-none"
                  />

                  <p className="mt-2 text-xs text-gray-600">
                    Select character image from your PC
                  </p>

                  {imageFile && (
                    <p className="mt-2 text-xs text-green-400">
                      {imageFile.name}
                    </p>
                  )}
                </div>
              </div>

              {imagePreview && (
                <div className="mt-5">
                  <p className="label">Image Preview</p>

                  <img
                    src={imagePreview}
                    alt="Character preview"
                    className="h-52 w-40 rounded-xl border border-red-500/30 object-cover shadow-lg"
                  />
                </div>
              )}

              <div className="mt-5">
                <label className="label">Famous Dialogue</label>

                <textarea
                  name="famousDialogue"
                  value={form.famousDialogue}
                  onChange={handleChange}
                  placeholder="Enter the character's famous dialogue..."
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
              subtitle="Power rating for each playable combat role"
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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="label">Special Role Name</label>

                  <input
                    type="text"
                    name="name"
                    value={form.specialRole.name}
                    onChange={handleSpecialRoleChange}
                    placeholder="Example: Memory Manipulator"
                    className="input"
                  />
                </div>

                <NumberInput
                  name="power"
                  value={form.specialRole.power}
                  onChange={handleSpecialRoleChange}
                  label="Special Role Power"
                />
              </div>
            </div>
          </section>

          <section className="blue-section">
            <SectionHeader
              title="POWER CATEGORIES"
              subtitle="Custom categories used for character power calculation"
              color="blue"
            />

            <div className="p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    Custom Power Stats
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Add as many custom power categories as required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addPowerCategory}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
                >
                  ADD CATEGORY
                </button>
              </div>

              <div className="space-y-4">
                {form.powerCategories.map((category, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-blue-500/20 bg-black/60 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                        Category #{index + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_180px_auto]">
                      <div>
                        <label className="label">Category Name</label>

                        <input
                          type="text"
                          value={category.name}
                          onChange={(event) =>
                            handlePowerCategoryChange(
                              index,
                              "name",
                              event.target.value,
                            )
                          }
                          placeholder="Example: Physical Power"
                          className="input"
                        />
                      </div>

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
                        onClick={() => removePowerCategory(index)}
                        className="rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 font-bold text-red-400 transition hover:border-red-500/50 hover:bg-red-900/60"
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="blue-section">
            <SectionHeader
              title="OVERALL POWER"
              subtitle="Automatically calculated from all battle ratings"
              color="blue"
            />

            <div className="p-6">
              <div className="rounded-xl border border-blue-500/20 bg-black/60 p-6">
                <p className="text-sm text-gray-400">
                  Overall Power is calculated automatically when the card is
                  created.
                </p>

                <p className="mt-2 text-xs text-gray-600">
                  Formula: Average of HP + Role Power + General Power + Special
                  Role Power + Custom Power Categories.
                </p>

                <div className="mt-4">
                  <span className="text-3xl font-black text-blue-400">
                    1 – 100
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="pb-10 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 py-4 text-lg font-black tracking-wide shadow-xl shadow-blue-950/40 transition hover:from-blue-600 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "ADDING CHARACTER..." : "ADD CHARACTER"}
            </button>
          </div>
        </form>
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
          ? "border-red-500/20 bg-red-950/30"
          : "border-blue-500/20 bg-blue-950/30"
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

function Input({
  name,
  value,
  onChange,
  placeholder,
  label,
  required = false,
}) {
  return (
    <div>
      <label className="label">
        {label || formatLabel(name)}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input"
      />
    </div>
  );
}

function NumberInput({ name, value, onChange, label }) {
  return (
    <div>
      <label className="label">{label || formatLabel(name)}</label>

      <input
        type="number"
        name={name}
        value={value}
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

export default AddCard;
