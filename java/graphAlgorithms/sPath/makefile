IDIR = ../../include
LDIR = ../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64 -I ${IDIR}
LIBFILES = dijkstra.o bfScan.o dijkstraAll.o floyd.o

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

dijkstra.o:    ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/Dheap.h 
badCase.o:     ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h
bfScan.o:      ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h \
	       ${IDIR}/Dheap.h
dijkstraAll.o: ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/Dheap.h 
floyd.o:       ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h
spt.o:         ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h
sptRep.o:      ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h
allPairs.o:    ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h
allPairsRep.o: ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h
sptUpdate.o:   ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h
sptUpdate2.o:  ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h
check.o:       ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h

all : ${LIBGA} xfiles

clean:
	rm -f *.o *.exe

${LIBGA}: ${LIBFILES}
	ar -ru ${LIBGA} ${LIBFILES}

xfiles:	badCase spt sptRep allPairs allPairsRep check sptUpdate

spt: spt.o ${LIBS} 
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

sptRep: sptRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

badCase: badCase.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

allPairs: allPairs.o ${LIBS} 
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

allPairsRep: allPairsRep.o ${LIBS} 
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

check: check.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

sptUpdate: sptUpdate.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

