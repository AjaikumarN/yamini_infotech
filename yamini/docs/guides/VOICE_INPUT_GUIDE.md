# 🎙️ Enhanced Voice Input Guide

## Overview
The salesman module now includes **context-aware Tamil-English voice recognition** that intelligently handles mixed-language input and preserves English words like customer names, product names, and technical terms.

## Key Features

### 1. **Tamil + English Code-Mixing Support**
- Speak naturally in Tamil, mixing in English words
- English words (customer names, product names) are automatically preserved
- Tamil words remain in their natural script

### 2. **Context-Aware Processing**
Different field types have specialized processing:

| Field Type | Behavior | Example Input | Processed Output |
|------------|----------|---------------|------------------|
| `customer_name` | Capitalizes all English words | "rajesh kumar" (Tamil context) | "Rajesh Kumar" |
| `shop_name` | Capitalizes all English words | "sri lakshmi stores" | "Sri Lakshmi Stores" |
| `product_name` | Capitalizes each word | "inverter battery" | "Inverter Battery" |
| `phone` | Extracts only digits | "nine eight seven six..." | "9876..." |
| `address` | Capitalizes first letter | "door number..." | "Door number..." |
| `remarks/notes` | Preserves mixed content | "customer wants luminous inverter" | "Customer wants Luminous inverter" |

### 3. **Smart English Word Detection**
- Automatically detects words containing Latin characters (a-z, A-Z)
- Preserves and properly formats these English words
- Keeps Tamil text unmodified

## Usage Examples

### Customer Name Input
**You speak:** "Customer name: Ramesh Patel"  
**System records:** "Ramesh Patel" ✓ (Auto-capitalized)

### Shop Name with Tamil
**You speak:** "கடை பெயர் Sri Vinayaka Electricals"  
**System records:** "Sri Vinayaka Electricals" ✓ (English part capitalized)

### Product Name
**You speak:** "Product: Luminous inverter மற்றும் Exide battery"  
**System records:** "Luminous Inverter மற்றும் Exide Battery" ✓

### Phone Number
**You speak:** "Phone: nine eight seven six five four three two one zero"  
**System records:** "9876543210" ✓ (Only digits extracted)

### Visit Notes (Mixed Language)
**You speak:** "வாடிக்கையாளர் Ramesh wants Luminous inverter for his shop"  
**System records:** "வாடிக்கையாளர் Ramesh wants Luminous inverter for his shop" ✓

## Components with Voice Input

### SalesmanVisits Form
Voice buttons available for:
- ✓ Customer Name (context: `customer_name`)
- ✓ Shop Name (context: `shop_name`)
- ✓ Contact Number (context: `phone`)
- ✓ Shop Address (context: `address`)
- ✓ Product Interest (context: `product_name`)
- ✓ Requirements (context: `remarks`)
- ✓ Visit Notes (context: `notes`)

### SalesmanDailyReport Form
Voice buttons available for:
- ✓ Additional Notes/Remarks (context: `notes`)

## Technical Implementation

### Field Context Types
```javascript
// Basic usage
<VoiceInputButton 
  fieldContext="customer_name"
  onTranscript={(text) => setFormData({...formData, customer_name: text})}
/>

// For appending to existing text (notes/remarks)
<VoiceInputButton 
  fieldContext="notes"
  onTranscript={(text) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes + (prev.notes ? ' ' : '') + text
    }));
  }}
/>
```

### Available Field Contexts
- `customer_name` - Capitalizes all words
- `shop_name` - Capitalizes all words
- `product_name` - Capitalizes all words
- `phone` - Extracts only digits
- `address` - Capitalizes first letter
- `remarks` - Capitalizes first letter, preserves rest
- `notes` - Capitalizes first letter, preserves rest
- `general` - Default behavior (preserves English, capitalizes properly)

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✓ Full | Best support for Web Speech API |
| Safari | ✓ Partial | Works on macOS/iOS |
| Firefox | ⚠️ Limited | Requires permissions |

## Tips for Best Results

1. **Speak Clearly**: Pause briefly between phrases
2. **English Names**: Pronounce clearly - system will capitalize automatically
3. **Product Names**: Speak brand names in English (e.g., "Luminous", "Exide")
4. **Mixed Input**: Feel free to mix Tamil and English naturally
5. **Review Text**: Always review the recognized text before saving
6. **Microphone Permission**: Grant permission when browser prompts

## Status Indicators

| Status | Meaning |
|--------|---------|
| 🎙️ (Default) | Ready to record |
| 🎙️ Listening… | Recording in progress |
| ✓ Success | Text converted successfully |
| ⚠️ Error | Recognition failed, try again |

## Examples of Mixed Language Input

### Visit Record
```
வாடிக்கையாளர் பெயர்: Rajesh Kumar
கடை: Sri Ganesh Electricals  
தேவை: 150 AH Exide battery மற்றும் Luminous inverter
குறிப்புகள்: Customer wants immediate delivery, discussed pricing
```

### Daily Report Notes
```
இன்று 8 shops visited. Met Ramesh at Sri Stores - interested in Luminous products.
விலை பேச்சுவார்த்தை completed with Suresh. Expected closing next week.
```

## Troubleshooting

**Problem:** English names not capitalized  
**Solution:** Ensure `fieldContext` is set to appropriate type (`customer_name`, `shop_name`, etc.)

**Problem:** Numbers not extracted from phone field  
**Solution:** Use `fieldContext="phone"` for phone number fields

**Problem:** Voice button not visible  
**Solution:** Browser may not support Web Speech API (use Chrome/Edge)

**Problem:** "Microphone permission denied"  
**Solution:** Enable microphone access in browser settings

## Future Enhancements

- [ ] Offline voice recognition support
- [ ] Custom vocabulary for product names
- [ ] Voice commands for form submission
- [ ] Multi-language switching (Tamil/English toggle)
- [ ] Voice feedback confirmation

---

**Note:** Voice input is an enhancement feature. Traditional keyboard input remains fully functional and is required as fallback in unsupported browsers.
