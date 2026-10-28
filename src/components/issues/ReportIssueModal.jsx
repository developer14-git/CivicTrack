import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Camera,
  ThumbsUp,
  MapPin,
  HelpCircle,
  Building2,
  Sparkles,
  Check,
  AlertTriangle,
  Loader2,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(false);
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
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

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

    let registeredIssue = newIssue;
    if (onSubmitIssue) {
      const created = onSubmitIssue(newIssue);
      if (created && created.id) {
        registeredIssue = created;
      }
    }
    setSubmittedIssue(registeredIssue);
    setIsSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 sm:py-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col text-left overflow-hidden bg-editorial-paper relative">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="report-modal-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                  {submittedIssue ? 'Public Infrastructure Damage Reported' : 'Report a Problem'}
                </h2>
                {!submittedIssue && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100/70 text-emerald-800 border border-emerald-200/70">
                    Civic Intake
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Help improve public infrastructure in New Town, Kolkata.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="w-9 h-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close report modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedIssue ? (
          /* Success Screen */
          <div className="p-8 sm:p-10 text-center space-y-6 overflow-y-auto custom-scrollbar">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100/90 px-3 py-1 rounded-md border border-slate-200/70 inline-block shadow-2xs">
                {submittedIssue.id}
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight pt-1">Civic Report Registered</h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
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
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Guided Reporting Form with Internal Scroll */
          <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar text-xs">
              {/* Refined Compact Demo Banner */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3.5 py-2.5 text-xs text-amber-900 flex items-center gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <p className="text-[11.5px] leading-relaxed text-amber-950/90">
                  <strong className="font-semibold text-amber-950">Demo mode:</strong> Reports are saved in this browser and are not submitted to NKDA, HIDCO, or other government authorities.
                </p>
              </div>

              {/* Step 1 — Describe the problem */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                      Step 1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Describe the problem</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    <span className="text-rose-500">*</span> Required fields
                  </span>
                </div>

                {/* Issue Title */}
                <div>
                  <label htmlFor="issue-title" className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Problem Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={titleInputRef}
                    id="issue-title"
                    type="text"
                    placeholder="e.g. Broken pavement and uncovered manhole near gate"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border ${
                      errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 bg-white'
                    } placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs`}
                  />
                  {errors.title && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.title}</span>
                    </p>
                  )}
                </div>

                {/* Category Dropdown & Helper */}
                <div className="space-y-1.5">
                  <label htmlFor="issue-category" className="block text-xs font-semibold text-slate-800">
                    Infrastructure Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="issue-category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200/90 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {CATEGORY_DETAILS[formData.category]?.examples && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 leading-relaxed flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Common examples: </span>
                        {CATEGORY_DETAILS[formData.category].examples}
                      </div>
                    </div>
                  )}
                </div>

                {/* Urgency & Impact (Priority Selection) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="block text-xs font-semibold text-slate-800">Urgency & Impact</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Illustrative SLA Target
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'Low', label: 'Low', desc: '~7 days SLA', note: 'Non-critical cosmetic repair' },
                      { id: 'Medium', label: 'Medium', desc: '~72 hours SLA', note: 'Disrupts normal activity' },
                      { id: 'High', label: 'High', desc: '~24 hours SLA', note: 'Immediate safety or flooding risk' },
                    ].map((p) => {
                      const isSelected = formData.priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleInputChange('priority', p.id)}
                          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-600/30 shadow-2xs'
                              : 'border-slate-200/90 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{p.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium mt-0.5">{p.desc}</div>
                          <div className="text-[10px] text-slate-400 mt-1 leading-tight">{p.note}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Description */}
                <div>
                  <label htmlFor="issue-desc" className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Description & Impact on Public Safety <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="issue-desc"
                    rows={3}
                    placeholder="Describe specific hazards, waterlogging extent, vehicular obstructions, or time of day the problem is most severe..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200/90 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Step 2 — Pin the location */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                      Step 2
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pin the location</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Click map or drag pin to mark exact location
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="issue-area" className="text-xs font-semibold text-slate-800 block mb-1">
                      Action Area <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="issue-area"
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200/90 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs cursor-pointer"
                    >
                      {NEW_TOWN_AREAS.filter((a) => a !== 'All Action Areas').map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="issue-sector" className="text-xs font-semibold text-slate-800 block mb-1">
                      Nearest Landmark Sector
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
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200/90 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs cursor-pointer truncate"
                    >
                      {NEW_TOWN_SECTORS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specific Street / Landmark Description */}
                <div>
                  <label htmlFor="issue-street" className="text-xs font-semibold text-slate-800 block mb-1">
                    Road, landmark, sector, or nearby public facility <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      id="issue-street"
                      type="text"
                      placeholder="e.g. Street 106, opposite CE Block Market Gate"
                      value={formData.floorRoom}
                      onChange={(e) => handleInputChange('floorRoom', e.target.value)}
                      className={`w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-lg border ${
                        errors.floorRoom ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 bg-white'
                      } placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs`}
                    />
                  </div>
                  {errors.floorRoom && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.floorRoom}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Step 3 — Review and submit */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                      Step 3
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Review and submit</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Verify report details</span>
                </div>

                {/* Compact Live Summary Strip */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Report Summary Preview
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-emerald-800">
                        {formData.category}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-700">
                        {formData.priority} Priority
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-900">
                    {formData.title.trim() ? (
                      formData.title.trim()
                    ) : (
                      <span className="text-slate-400 italic">No title entered yet</span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{formData.area || 'Action Area I'}</span>
                    <span className="text-slate-300">•</span>
                    <span className="truncate max-w-[280px]">
                      {formData.floorRoom.trim() || formData.building || 'Location unpinned'}
                    </span>
                    {formData.coordinates && (
                      <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.5 rounded ml-auto">
                        {Number(formData.coordinates.lat).toFixed(4)}, {Number(formData.coordinates.lng).toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Photo Evidence */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Photo Evidence <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 border border-slate-200/90 rounded-lg hover:bg-slate-50 text-slate-700 inline-flex items-center gap-2 cursor-pointer text-xs font-medium transition-colors shadow-2xs"
                    >
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>{photoPreview ? 'Change Photo' : 'Attach Photo Evidence'}</span>
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
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer underline"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                  {errors.photo && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.photo}</span>
                    </p>
                  )}
                  {photoPreview && (
                    <div className="mt-2.5 rounded-xl border border-slate-200 overflow-hidden max-h-40 max-w-sm shadow-xs">
                      <img src={photoPreview} alt="Evidence Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Duplicate Detection Alert Box */}
                {possibleDuplicates.length > 0 && !acknowledgedDuplicates && (
                  <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Possible Existing Report Found Nearby</span>
                    </div>

                    <p className="text-slate-800 text-xs leading-snug">
                      <strong>{possibleDuplicates[0].issue.title}</strong> at{' '}
                      {possibleDuplicates[0].issue.location || possibleDuplicates[0].issue.building}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Status: <strong className="text-slate-800">{possibleDuplicates[0].issue.status}</strong> • {possibleDuplicates[0].issue.supporters || 0} citizen endorsements
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSupportExisting(possibleDuplicates[0].issue)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Support existing report (+1)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAcknowledgedDuplicates(true);
                          if (errors.duplicates) setErrors((prev) => ({ ...prev, duplicates: null }));
                        }}
                        className="px-3.5 py-1.5 bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-medium rounded-lg cursor-pointer text-xs transition-colors"
                      >
                        Report a different issue
                      </button>
                    </div>
                  </div>
                )}
                {errors.duplicates && (
                  <p className="text-rose-600 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.duplicates}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50/95 backdrop-blur-xs border-t border-slate-200/80 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Queued directly to public records in demonstration storage</span>
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
