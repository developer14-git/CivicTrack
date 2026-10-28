import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Camera,
  ThumbsUp,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_DETAILS,
  NEW_TOWN_SECTORS,
  NEW_TOWN_AREAS,
  CURRENT_SIMULATED_USER,
} from '../../data/mockIssues';
import { detectPossibleDuplicates } from '../../utils/duplicateDetection';
import LocationPicker from './LocationPicker';

export default function ReportIssueModal({
  isOpen,
  onClose,
  onSubmitIssue,
  selectedCampus,
  onViewCreatedIssue,
  existingIssues = [],
  onToggleSupport,
  onOpenIssueDetail,
  initialFormData = null,
}) {
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0] || 'Roads and Footpaths',
    area: 'Action Area I',
    building: NEW_TOWN_SECTORS[0],
    floorRoom: '',
    description: '',
    priority: 'Medium',
    coordinates: null,
    locationPrecision: 'approximate-landmark',
    locationSource: 'Approximate Landmark Location',
    exactLat: '',
    exactLng: '',
  });

  const [prevInitialFormData, setPrevInitialFormData] = useState(initialFormData);

  if (initialFormData !== prevInitialFormData) {
    setPrevInitialFormData(initialFormData);
    if (initialFormData) {
      setFormData((prev) => ({
        ...prev,
        ...initialFormData,
      }));
    }
  }

  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submittedIssue, setSubmittedIssue] = useState(null);
  const [acknowledgedDuplicates, setAcknowledgedDuplicates] = useState(false);

  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);

  // Detect possible duplicates against in-memory issues
  const possibleDuplicates = useMemo(() => {
    return detectPossibleDuplicates(formData, existingIssues);
  }, [formData, existingIssues]);

  const handleModalClose = useCallback(() => {
    setFormData({
      title: '',
      category: CATEGORIES[0] || 'Roads and Footpaths',
      area: 'Action Area I',
      building: NEW_TOWN_SECTORS[0],
      floorRoom: '',
      description: '',
      priority: 'Medium',
      coordinates: null,
      locationPrecision: 'approximate-landmark',
      locationSource: 'Approximate Landmark Location',
      exactLat: '',
      exactLng: '',
    });
    setPhotoPreview(null);
    setErrors({});
    setSubmittedIssue(null);
    setAcknowledgedDuplicates(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 50);

    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        handleModalClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleModalClose]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (field === 'title' || field === 'building' || field === 'area' || field === 'category') {
      setAcknowledgedDuplicates(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, photo: 'Please select an image file.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setErrors((prev) => ({ ...prev, photo: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Please describe what the infrastructure problem is.';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    }

    if (!formData.floorRoom.trim()) {
      newErrors.floorRoom = 'Please specify the road, landmark, sector, or nearby public facility.';
    }

    // If duplicate detected and not acknowledged
    if (possibleDuplicates.length > 0 && !acknowledgedDuplicates) {
      newErrors.duplicates = 'Please review the existing report below or confirm this is a separate issue.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Choice 1: Support existing report
  const handleSupportExisting = (matchedIssue) => {
    if (!matchedIssue.supportedByMe && onToggleSupport) {
      onToggleSupport(matchedIssue.id);
    }
    handleModalClose();
    if (onOpenIssueDetail) {
      onOpenIssueDetail(matchedIssue.id);
    }
  };

  // Choice 2: Submit new report
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const chosenArea = formData.area || selectedCampus || 'Action Area I';
    const landmarkText = formData.floorRoom.trim();
    const locationString = `${chosenArea} • ${landmarkText}`;

    let exactCoords = null;
    let locationPrecision =
      formData.building === 'Other / Unmapped New Town Location' ? 'unmapped' : 'approximate-landmark';
    let locationSource = 'Approximate Landmark Location';

    if (
      formData.coordinates &&
      typeof formData.coordinates.lat === 'number' &&
      typeof formData.coordinates.lng === 'number' &&
      !isNaN(formData.coordinates.lat) &&
      !isNaN(formData.coordinates.lng)
    ) {
      exactCoords = {
        lat: Number(formData.coordinates.lat.toFixed(5)),
        lng: Number(formData.coordinates.lng.toFixed(5)),
      };
      if (formData.locationPrecision === 'verified-gps') {
        locationPrecision = 'verified-gps';
        locationSource = formData.locationSource || 'Browser Geolocation (GPS)';
      } else if (formData.locationPrecision === 'approximate-landmark') {
        locationPrecision = 'approximate-landmark';
        locationSource = formData.locationSource || 'Approximate Landmark Location';
      } else {
        locationPrecision = 'user-pinned';
        locationSource = formData.locationSource || 'Pinned on Interactive Map';
      }
    } else if (
      formData.exactLat &&
      formData.exactLng &&
      String(formData.exactLat).trim() !== '' &&
      String(formData.exactLng).trim() !== ''
    ) {
      const parsedLat = parseFloat(formData.exactLat);
      const parsedLng = parseFloat(formData.exactLng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        exactCoords = { lat: Number(parsedLat.toFixed(5)), lng: Number(parsedLng.toFixed(5)) };
        locationPrecision = 'user-pinned';
        locationSource = 'Manual Coordinate Entry';
      }
    }

    if (formData.locationPrecision === 'unmapped' || formData.building === 'Other / Unmapped New Town Location') {
      exactCoords = null;
      locationPrecision = 'unmapped';
      locationSource = 'Unmapped Queue';
    }

    const newIssue = {
      title: formData.title.trim(),
      category: formData.category,
      campus: chosenArea,
      area: chosenArea,
      neighbourhood: landmarkText,
      building: formData.building,
      floorRoom: landmarkText,
      location: locationString,
      description: formData.description.trim() || formData.title.trim(),
      priority: formData.priority,
      photoUrl: photoPreview,
      status: 'Open',
      supporters: 1,
      supportedByMe: true,
      reportedBy: `${CURRENT_SIMULATED_USER.name} (Resident, ${chosenArea})`,
      isMyReport: true,
      coordinates: exactCoords,
      locationPrecision,
      locationSource,
    };

    if (onSubmitIssue) {
      onSubmitIssue(newIssue);
    }
    setSubmittedIssue(newIssue);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div>
            <h2 id="report-modal-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {submittedIssue ? 'Public Infrastructure Damage Reported' : 'Report Damaged Public Infrastructure'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Help bring this issue to the attention of the responsible authority.
            </p>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedIssue ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100/90 px-3 py-1 rounded-md border border-slate-200/70">
                {submittedIssue.id}
              </span>
              <h3 className="text-lg font-bold text-slate-900 pt-2">Civic Report Registered</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                &ldquo;{submittedIssue.title}&rdquo; has been added to New Town public records and queued for field maintenance.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const issueId = submittedIssue.id;
                  handleModalClose();
                  if (onViewCreatedIssue) onViewCreatedIssue(issueId);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Honest Prototype Notice */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-semibold text-amber-950">Local Prototype Notice:</strong> This demonstration application stores reports in your browser&apos;s local storage to test workflows. Reports are not submitted to NKDA, HIDCO, or other government authorities.
                </div>
              </div>

              {/* Field 1: What is the problem? */}
              <div>
                <label htmlFor="issue-title" className="block font-semibold text-slate-800 mb-1">
                  1. What is the infrastructure problem? <span className="text-rose-600">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  id="issue-title"
                  type="text"
                  placeholder="e.g. Broken pavement and uncovered manhole near gate"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors`}
                />
                {errors.title && (
                  <p className="text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Category */}
              <div>
                <label htmlFor="issue-category" className="block font-semibold text-slate-800 mb-1">
                  2. Infrastructure Category <span className="text-rose-600">*</span>
                </label>
                <select
                  id="issue-category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {CATEGORY_DETAILS[formData.category]?.examples && (
                  <p className="text-[11px] text-slate-600 mt-1.5 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 leading-relaxed">
                    <span className="font-semibold text-slate-700">Common examples: </span>
                    {CATEGORY_DETAILS[formData.category].examples}
                  </p>
                )}
              </div>

              {/* Field 3: Location in New Town with Interactive Location Picker */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-800">
                    3. Location in New Town <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Pin damage spot on map, search, or select below
                  </span>
                </div>

                {/* Interactive Leaflet/OpenStreetMap Location Picker */}
                <LocationPicker
                  coordinates={formData.coordinates}
                  locationPrecision={formData.locationPrecision}
                  locationSource={formData.locationSource}
                  onChange={({
                    coordinates,
                    locationPrecision,
                    locationSource,
                    floorRoom,
                    area,
                    sector,
                    nearestLandmark,
                  }) => {
                    setFormData((prev) => {
                      const next = {
                        ...prev,
                        coordinates: coordinates || null,
                        locationPrecision: locationPrecision || (coordinates ? 'user-pinned' : 'unmapped'),
                        locationSource: locationSource || (coordinates ? 'Pinned on Interactive Map' : 'Unmapped'),
                        exactLat: coordinates?.lat ? String(coordinates.lat) : '',
                        exactLng: coordinates?.lng ? String(coordinates.lng) : '',
                      };
                      if (area && NEW_TOWN_AREAS.includes(area)) {
                        next.area = area;
                      }
                      if (sector && NEW_TOWN_SECTORS.includes(sector)) {
                        next.building = sector;
                      }
                      if (floorRoom !== undefined) {
                        next.floorRoom = floorRoom;
                      } else if (!prev.floorRoom && nearestLandmark?.description) {
                        next.floorRoom = nearestLandmark.description;
                      }
                      return next;
                    });
                    if (errors.floorRoom) {
                      setErrors((prev) => ({ ...prev, floorRoom: null }));
                    }
                  }}
                />

                {/* Structured Area & Nearest Landmark Sector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label htmlFor="issue-area" className="text-[11px] text-slate-500 block mb-0.5">
                      Action Area:
                    </label>
                    <select
                      id="issue-area"
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                    >
                      {NEW_TOWN_AREAS.filter((a) => a !== 'All Action Areas').map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="issue-sector" className="text-[11px] text-slate-500 block mb-0.5">
                      Nearest Landmark Sector:
                    </label>
                    <select
                      id="issue-sector"
                      value={formData.building}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange('building', val);
                        if (val === 'Other / Unmapped New Town Location') {
                          setFormData((prev) => ({
                            ...prev,
                            building: val,
                            coordinates: null,
                            locationPrecision: 'unmapped',
                            locationSource: 'Unmapped',
                            exactLat: '',
                            exactLng: '',
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors truncate"
                    >
                      {NEW_TOWN_SECTORS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="issue-street" className="text-[11px] text-slate-500 block mb-0.5">
                    Road, landmark, sector, or nearby public facility: <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="issue-street"
                      type="text"
                      placeholder="e.g. Street 106, opposite CE Block Market Gate"
                      value={formData.floorRoom}
                      onChange={(e) => handleInputChange('floorRoom', e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border ${
                        errors.floorRoom ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90'
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors`}
                    />
                  </div>
                  {errors.floorRoom && (
                    <p className="text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.floorRoom}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Field 4: Priority Guidance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="block font-semibold text-slate-800">4. Urgency & Impact</span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Illustrative SLA Target
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Low', label: 'Low', desc: '~7 days', note: 'Non-critical cosmetic repair' },
                    { id: 'Medium', label: 'Medium', desc: '~72 hours', note: 'Disrupts normal activity' },
                    { id: 'High', label: 'High', desc: '~24 hours', note: 'Immediate safety or flooding risk' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleInputChange('priority', p.id)}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        formData.priority === p.id
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-600/30'
                          : 'border-slate-200/90 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs">{p.label}</div>
                      <div className="text-[10px] text-slate-500">{p.desc}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{p.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duplicate Detection Alert Box */}
              {possibleDuplicates.length > 0 && !acknowledgedDuplicates && (
                <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Possible Existing Report Found</span>
                  </div>

                  <p className="text-slate-700 text-xs leading-snug">
                    <strong>{possibleDuplicates[0].issue.title}</strong> at{' '}
                    {possibleDuplicates[0].issue.location || possibleDuplicates[0].issue.building}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Status: <strong className="text-slate-700">{possibleDuplicates[0].issue.status}</strong> • {possibleDuplicates[0].issue.supporters || 0} supporters
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSupportExisting(possibleDuplicates[0].issue)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Support existing report (+1)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAcknowledgedDuplicates(true);
                        if (errors.duplicates) setErrors((prev) => ({ ...prev, duplicates: null }));
                      }}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer text-xs transition-colors"
                    >
                      Report a different issue
                    </button>
                  </div>
                </div>
              )}

              {/* Field 5: Description & Impact */}
              <div>
                <label htmlFor="issue-desc" className="block font-semibold text-slate-800 mb-1">
                  5. Description & Impact on Public Safety (optional)
                </label>
                <textarea
                  id="issue-desc"
                  rows={3}
                  placeholder="Describe the infrastructure damage and its impact on pedestrian or vehicular safety, waterlogging, or immediate hazards..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* Field 6: Photo Upload */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">6. Photo Evidence (optional)</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 border border-slate-200/90 rounded-lg hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>{photoPreview ? 'Change Photo' : 'Attach Photo'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="text-rose-600 hover:underline cursor-pointer text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {photoPreview && (
                  <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden max-h-36 max-w-xs shadow-xs">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Coordinates are optional; municipal review queues immediately
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
