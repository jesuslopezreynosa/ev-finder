var e=`# Batteries

## Chemistries

### LFP - Lithium Iron Phosphate

- Slightly less energy dense (heavier for the same amount of energy compared to other batteries), but they are more stable chemistry
- Least expensive type of Lithium cell as it uses more abundant materials (Iron is cheaper than Cobalt, Manganese or Aluminum)
- Can be charged to 100% more often, most manufacturers recommend defaulting to a 100% charge limit for this chemistry for calibrating the BMS
- Can usually retain 70-80% of its original capacity after 3,000-5,000 charge cycles (longest lifetime)
- Least fire / thermal runaway risk
  - Requires a much higher temperature to start a reaction event (~270°C / ~518°F)
  - The chemistry not produce oxygen in a fire, so it cannot self-sustain a fire
- Less ethical concerns regarding materials as it does not use cobalt and nickel
- Older LFP chemistries (~before 2022) are less viable for cold-weather since internal resistance increases in colder temperatures thus reducing usable range in these climates, newer LFP packs are better tuned for a diverse set of climates
- Modern LFP cells can be charged fairly quickly nowadays
  - For example, the 2023 Tesla Model 3 RWD w/ LFP cells can charge up to 170 kW at a DC Fast Charger

### NCM - Nickel Cobalt Manganese

- More energy dense, which means less cells and materials needed for a certain amount of energy
- More resiliant in cold climates (still experiences some range loss but less than LFP)
- Cannot be charged to 100% constantly, most manufacturers recommend charging to 80-90% for everyday driving and only charging to 100% for long trips
- Lower cycle life compared to LFP, usually retaining 80% of original capacity after 1,000-1,500 charge cycles
- More common in longer range and performance-oriented EVs since they can sustain higher current draw for longer

### NCA - Nickel Cobalt Aluminum

- More energy dense, similar to NCM cells
- Most expensive, as they require more pure nickel and cobalt
- Cannot be charged to 100% constantly, most manufacturers recommend charging to 80-90% for everyday driving and only charging to 100% for long trips
- Lower cycle life compared to LFP, usually retaining 80% of original capacity after 1,000-1,500 charge cycles
- Can handle the most demanding current draw applications, more oriented for very fast charging and high-output motors

### NCMA - Nickel Cobalt Manganese Aluminum

- Most energy-dense chemistry
- Higher nickel content than NCM or NCA cells
- Better chemical structure than NCM & NCA, they last longer, retaining most of their capacity after 1,000-2,000 cycles (but not as good as LFP)
- Less cobalt per cell
- More thermally stable than NCM & NCA
- GM (General Motors) is currently the only manufacturer using these types of cells, mainly because they can now state much higher real-world ranges for their EVs (i.e. the Silverado EV can go up to 450 miles in a single charge)
  - Tesla is also looking into utilizing NCMA chemistries, but currently it is not very widely published

## What is a 'Charge Cycle'?

A charge cycle is based on the cumulative amount of energy discharged from and refilled into a battery; it is not simply the number of times you plug your vehicle into a charger.

For example, if you have a 100 kWh battery, discharge a total of 100 kWh (whether all at once or spread out over several days), and then charge it back up 100 kWh, that entire event is exactly **one charge cycle**.

This means the actual operational lifespan of an EV battery pack is measured by the total energy throughput over time. Consider an EV with a 70 kWh LFP battery pack. If we assume a conservative lifespan of 3,000 cycles before the battery degrades to 70% capacity, the total energy throughput is:

$$70 \\text{ kWh} \\times 3,000 \\text{ cycles} = 210,000 \\text{ kWh}$$

Even if the vehicle is highly inefficient, the battery pack is structurally engineered to last:

$$210,000 \\text{ kWh} \\times 2.5 \\text{ mi/kWh} = 525,000 \\text{ miles}$$

It is also important to note that reaching the end of these rated cycles does not make the battery useless. It simply means the pack's maximum storage capacity has degraded to roughly 70% of its factory-new state. For a 70 kWh pack, the maximum usable energy capacity would simply decrease to 49 kWh.

<!-- ## Battery Care

## Safety -->`;export{e as default};