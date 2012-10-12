IDIR = ../../include
LDIR = ../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64 -I ${IDIR}

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

kruskal.o:    ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/Partition.h
prim.o:       ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/Dheap.h
primF.o:      ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/Fheaps.h
rrobin.o:     ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/Llheaps.h ${IDIR}/Partition.h

mst.o:        ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h
mstRep.o:     ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h
mstUpdate.o:  ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h
mstUpdate2.o: ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h

all:	${LIBGA} xfiles

clean:
	rm -f *.o *.exe

${LIBGA}:kruskal.o prim.o primF.o rrobin.o
	ar -ru ${LIBGA} kruskal.o prim.o primF.o rrobin.o

xfiles:	mst mstRep check mstUpdate mstUpdate2

mst: mst.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

mstRep: mstRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

check: check.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

mstUpdate: mstUpdate.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

mstUpdate2: mstUpdate2.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@
